import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { catchError, firstValueFrom } from 'rxjs';
import { JwtPayloadDto } from 'src/common/dto/jwt-payload.dto';
import { ForbiddenException } from 'src/common/exception/types/forbidden.exception';
import { Readable } from 'stream';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Logger } from 'winston';
import { NotFoundException } from '../../common/exception/types/not-found.exception';
import { BaseService } from '../../common/service/base.service';
import { PostInstagram } from '../post-instagram/entities/post-instagram.entity';
import { StorageService } from '../storage/storage.service';
import { CreateUserInstagramDto } from './dto/create-user-instagram.dto';
import { ResponseUserInstagramRapidApi } from './dto/response-user-instagram-rapidapi.dto';
import { UserInstagram } from './entities/user-instagram.entity';

@Injectable()
export class UserInstagramService extends BaseService<
  UserInstagram,
  CreateUserInstagramDto
> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserInstagram)
    private readonly repository: Repository<UserInstagram>,
    private readonly httpService: HttpService,
    private readonly storageService: StorageService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    super(repository);
  }

  /*
    Default Relationship
  */
  defaultRelation() {
    return ['postInstagram'];
  }

  private getUsername(
    dto: CreateUserInstagramDto | CreateUserInstagramDto[],
  ): string {
    return Array.isArray(dto) ? dto[0].username : dto.username;
  }

  async searchUserInstagram(username: string): Promise<{
    count: number;
    items: ResponseUserInstagramRapidApi[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(
            `https://instagram-scraper-api2.p.rapidapi.com/v1/search_users?search_query=${username}`,
            {
              headers: {
                'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
                'x-rapidapi-key':
                  this.configService.get<string>('RAPID_API_KEY'),
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error('Error scraping user instagram', error);
              throw error;
            }),
          ),
      );

      if (response.status !== 200) {
        throw new NotFoundException('User instagram not found');
      }

      return response.data.data;
    } catch (error) {}
  }

  private async scrapeInstagramPosts(username: string) {
    try {
      const responseScrapingUser = await firstValueFrom(
        this.httpService.get(
          `https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts?username_or_id_or_url=${username}`,
          {
            headers: {
              'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
              'x-rapidapi-key': this.configService.get('RAPID_API_KEY'),
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        `ERROR SCRAPING USER INSTAGRAM: ${username}`,
        UserInstagramService.name,
        error,
      );
      if (error.status === 403) {
        throw new ForbiddenException(
          `Akun Instagram ${username} Bersifat Private`,
        );
      } else if (error.status === 400) {
        throw new NotFoundException('User instagram not found');
      }

      throw error;
    }
  }

  private async downloadAndUploadProfilePicture(
    profilePicUrl: string,
    username: string,
  ): Promise<string> {
    const profilePictureResponse = await this.httpService.axiosRef({
      method: 'get',
      url: profilePicUrl,
      responseType: 'arraybuffer',
    });

    const profilePictureFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: `profile-picture-${username}.jpg`,
      encoding: '7bit',
      mimetype: profilePictureResponse.headers['content-type'],
      size: Buffer.byteLength(profilePictureResponse.data),
      buffer: Buffer.from(profilePictureResponse.data),
      stream: Readable.from(profilePictureResponse.data),
      destination: '',
      path: '',
      filename: '',
    };

    return this.storageService.uploadFile(profilePictureFile, 'public-read');
  }

  private async downloadAndUploadThumbnail(
    thumbnailUrl: string,
    postCode: string,
  ): Promise<string> {
    const thumbnailResponse = await this.httpService
      .axiosRef({
        method: 'get',
        url: thumbnailUrl,
        responseType: 'arraybuffer',
      })
      .catch((error: AxiosError) => {
        this.logger.error(`ERROR DOWNLOAD THUMBNAIL POST: ${postCode}`, error);
        throw error;
      });

    const thumbnailFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: `thumbnail-${postCode}.jpg`,
      encoding: '7bit',
      mimetype: thumbnailResponse.headers['content-type'],
      size: Buffer.byteLength(thumbnailResponse.data),
      buffer: Buffer.from(thumbnailResponse.data),
      stream: Readable.from(thumbnailResponse.data),
      destination: '',
      filename: '',
      path: '',
    };

    return this.storageService.uploadFile(thumbnailFile, 'public-read');
  }

  private async processPost(
    post: any,
    username: string,
  ): Promise<Partial<PostInstagram> | null> {
    this.logger.log(
      `CHECK POST INSTAGRAM: ${username} - ${post.code}`,
      UserInstagramService.name,
    );

    const existingPost = await this.dataSource
      .getRepository(PostInstagram)
      .findOne({
        where: { code: post.code },
      });

    if (existingPost) {
      this.logger.log(
        `POST INSTAGRAM ALREADY EXIST: ${username} - ${post.code}`,
        UserInstagramService.name,
      );
      return null;
    }

    const thumbnailPostUrl =
      post.thumbnail_url !== 'None'
        ? post.thumbnail_url
        : post.resources[0].thumbnail_url;

    const thumbnailUrl = await this.downloadAndUploadThumbnail(
      thumbnailPostUrl,
      post.code,
    );

    const caption = post.caption_text
      ? post.caption_text
      : post.caption?.text
        ? post.caption?.text
        : '';

    return {
      code: post.code,
      instagramId: post.id,
      instagramPk: post.pk ? post.pk : post.id,
      takenAt: this.parseTakenAt(post.taken_at),
      caption: caption,
      thumbnailUrl: thumbnailUrl,
      mediaUrl: thumbnailUrl,
      postUrl: 'https://www.instagram.com/p/' + post.code,
    };
  }

  private parseTakenAt(takenAt: number | string): Date {
    if (typeof takenAt === 'number' && takenAt > 0) {
      return new Date(takenAt * 1000);
    }
    if (typeof takenAt === 'string' && !isNaN(Date.parse(takenAt))) {
      return new Date(takenAt);
    }
    return new Date();
  }

  async create(
    createUserInstagramDto: CreateUserInstagramDto | CreateUserInstagramDto[],
    user: JwtPayloadDto,
    manager?: EntityManager,
  ): Promise<any> {
    const username = this.getUsername(createUserInstagramDto);
    this.logger.log(
      `SCRAPE USER INSTAGRAM: ${username}`,
      UserInstagramService.name,
    );

    let userInstagramInstance = await this.repository.findOne({
      where: { username },
      relations: ['postInstagram'],
    });

    let scrapePosts: any;
    try {
      scrapePosts = await this.scrapeInstagramPosts(username);
    } catch (error) {
      throw error;
    }

    let profilePictureUrl = userInstagramInstance?.profilePic;

    if (!userInstagramInstance) {
      profilePictureUrl = await this.downloadAndUploadProfilePicture(
        scrapePosts.data.data.user.profile_pic_url,
        username,
      );
    }

    const postInstagrams: Partial<PostInstagram>[] = [];
    for (const post of scrapePosts.data.data.items) {
      const processedPost = await this.processPost(post, username);
      if (processedPost) {
        postInstagrams.push(processedPost);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      if (userInstagramInstance) {
        this.logger.log(
          `UPDATE USER INSTAGRAM: ${Array.isArray(createUserInstagramDto) ? createUserInstagramDto[0].username : createUserInstagramDto.username}`,
          UserInstagramService.name,
        );
        const updatedUser = await manager.getRepository(UserInstagram).save({
          ...userInstagramInstance,
          profilePic: profilePictureUrl,
        });

        if (postInstagrams.length === 0) {
          return;
        }

        this.logger.log(
          `INSERT POST INSTAGRAM: ${Array.isArray(createUserInstagramDto) ? createUserInstagramDto[0].username : createUserInstagramDto.username}`,
          UserInstagramService.name,
        );

        await manager.getRepository(PostInstagram).save(
          postInstagrams.map((post) => ({
            ...post,
            user: {
              id: updatedUser.id,
            },
          })),
        );
      } else {
        this.logger.log(
          `INSERT USER INSTAGRAM: ${Array.isArray(createUserInstagramDto) ? createUserInstagramDto[0].username : createUserInstagramDto.username}`,
          UserInstagramService.name,
        );
        userInstagramInstance = await manager
          .getRepository(UserInstagram)
          .save({
            ...createUserInstagramDto,
            profilePic: profilePictureUrl,
            postInstagram: postInstagrams,
          });

        this.logger.log(
          `INSERT POST INSTAGRAM: ${Array.isArray(createUserInstagramDto) ? createUserInstagramDto[0].username : createUserInstagramDto.username}`,
          UserInstagramService.name,
        );

        await manager.getRepository(PostInstagram).save(
          postInstagrams.map((post) => ({
            ...post,
            user: userInstagramInstance,
          })),
        );
      }
    });

    this.logger.log('DONE SCRAPE USER INSTAGRAM', UserInstagramService.name);

    const result = await this.repository.findOne({
      where: {
        username: userInstagramInstance?.username,
      },
      relations: ['postInstagram'],
    });

    const _result: any = {
      ...result,
      totalPost: result?.postInstagram?.length,
    };

    delete _result.postInstagram;

    return _result;
  }
}
