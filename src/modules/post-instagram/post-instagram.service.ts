import { Inject, Injectable } from '@nestjs/common';
import { CreatePostInstagramDto } from './dto/create-post-instagram.dto';
import { UpdatePostInstagramDto } from './dto/update-post-instagram.dto';
import { BaseService } from '../../common/service/base.service';
import { PostInstagram } from './entities/post-instagram.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { TfIdf } from 'natural';
import { NotFoundException } from '../../common/exception/types/not-found.exception';
import cleanCaption from '../../common/utils/cleanCaption';
import { Article } from '../articles/entities/article.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ArticleService } from '../articles/articles.service';
import { ArticleStatus } from '../../common/enum/status.enum';
import { JwtPayloadDto } from '../../common/dto/jwt-payload.dto';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { ResponsePostInstagramDto } from './dto/response-post-instagram.dto';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { ForbiddenException } from '../../common/exception/types/forbidden.exception';
import { ResponsePostInstagramUserDto } from './dto/response-post-instagram-user.dto';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

@Injectable()
export class PostInstagramService extends BaseService<
  PostInstagram,
  CreatePostInstagramDto
> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PostInstagram)
    private readonly repository: Repository<PostInstagram>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly articleService: ArticleService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    super(repository);
  }

  async convertToArticle(id: number, user?: JwtPayloadDto): Promise<Article> {
    try {
      const post = await this.findOneBy({
        where: {
          id: id,
        },
        relations: ['user'],
      });

      if (!post) {
        this.logger.error('Post not found');
        throw new NotFoundException('Post not found');
      }

      const convertedTitle = await this.extractMainSentence(post.caption);

      const convertedCategories = await this.extractCategories(post.caption);

      const article = await this.articleService.create({
        title: convertedTitle,
        mediaUrl: post.mediaUrl,
        content: post.caption,
        status: ArticleStatus.ARCHIVED,
        categories: convertedCategories,
        postInstagram_id: post.id,
      });

      return Array.isArray(article) ? article[0] : article;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  preprocessCaption = (caption: string): string => {
    return caption
      .replace(/#[A-Za-z0-9_]+/g, '')
      .replace(/@[A-Za-z0-9_]+/g, '')
      .replace(/[^\w\s.,!?]/g, '')
      .trim();
  };

  private async extractMainSentence(caption: string): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const prompt = `
    Ubah caption Instagram berikut menjadi judul artikel yang menarik 
    dan profesional dengan maksimal 8 kata:
    
    Caption: ${caption}
    
    Judul yang baik harus:
    1. Mengandung kata kunci utama
    2. Memicu rasa penasaran
    3. Menggunakan struktur subjek-predikat
    4. Optimasi untuk SEO
    `;

    try {
      const completions = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that creates SEO-friendly, engaging article titles from Instagram captions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4o',
        max_tokens: 60,
      });

      const title = completions.choices[0]?.message?.content
        ?.trim()
        .replace(/^"+|"+$/g, '');

      return title;
    } catch (error) {
      this.logger.error('Error extracting main sentence', error);
      throw new Error('Error extracting main sentence');
    }
  }

  private async extractCategories(caption: string): Promise<string[]> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const prompt = `
  Tentukan 3 sampai 5 kategori/topik utama dari caption Instagram berikut:
  
  Caption: "${caption}"
  
  Berikan hasil dalam bentuk list JSON array string. Contoh:
  ["Gaya Hidup", "Traveling", "Motivasi"]
  `;

    try {
      const completions = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah asisten yang ahli dalam menganalisis caption Instagram dan mengelompokkan topik/kategori kontennya.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const content = completions.choices[0]?.message?.content?.trim();

      if (!content) return [];

      // Parse hasil array dari string
      const categories = JSON.parse(content);

      if (!Array.isArray(categories)) {
        throw new Error('Unexpected format');
      }

      return categories;
    } catch (error) {
      this.logger.error('Error extracting categories with AI', error);
      return [];
    }
  }

  async findUserPost(username: string): Promise<{
    count: number;
    items: ResponsePostInstagramUserDto[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(
            `https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=${username}`,
            {
              headers: {
                'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
                'x-rapidapi-key': this.configService.get('RAPID_API_KEY'),
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
        if (response.status === 403) {
          throw new ForbiddenException(
            'Tidak bisa melihat postingan user dengan tipe Private',
          );
        }

        throw new NotFoundException('User instagram not found');
      }

      return response.data.data;
    } catch (error) {}
  }
}
