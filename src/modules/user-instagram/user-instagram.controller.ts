import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
} from '@nestjs/common';
import { UserInstagramService } from './user-instagram.service';
import { CreateUserInstagramDto } from './dto/create-user-instagram.dto';
import { UpdateUserInstagramDto } from './dto/update-user-instagram.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auths/jwt-auth.guard';
import {
  CreateSwaggerExample,
  DeleteSwaggerExample,
  DetailSwaggerExample,
  ListSwaggerExample,
} from '../../common/swagger/swagger-example.response';
import { ResponseUserInstagramDto } from './dto/response-user-instagram.dto';
import { BaseSuccessResponse } from '../../common/response/base.response';
import { plainToInstance } from 'class-transformer';
import { FilteringUserInstagramDto } from './dto/filtering-user-instagram.dto';
import { PathParameterDto } from '../../common/dto/path-parameter.dto';
import { UpdateResult } from 'typeorm';
import { ResponsePostInstagramDto } from '../post-instagram/dto/response-post-instagram.dto';
import { PostInstagramService } from '../post-instagram/post-instagram.service';
import { ResponseUserInstagramRapidApi } from './dto/response-user-instagram-rapidapi.dto';
import { SearchUserInstagramDto } from './dto/search-user-instagram.dto';

@Controller('user-instagram')
@ApiTags('UserInstagram')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserInstagramController {
  constructor(
    private readonly userInstagramService: UserInstagramService,
    private readonly postInstagramService: PostInstagramService,
  ) {}

  @CreateSwaggerExample(
    CreateUserInstagramDto,
    ResponseUserInstagramDto,
    false,
    'Membuat satu User Instagram Sekaligus Scraping Post Instagram',
  )
  @Post()
  async create(
    @Body() createUserInstagramDto: CreateUserInstagramDto,
    @Request() req: any,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramDto>> {
    const result = await this.userInstagramService.create(
      createUserInstagramDto,
      req.user,
    );
    return {
      data: plainToInstance(ResponseUserInstagramDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('search')
  @ListSwaggerExample(ResponseUserInstagramRapidApi, 'Mencari User Instagram')
  async search(
    @Request() req: any,
    @Query() search: SearchUserInstagramDto,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramRapidApi>> {
    const { count, items } =
      await this.userInstagramService.searchUserInstagram(search.username);

    return {
      data: plainToInstance(ResponseUserInstagramRapidApi, items, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page: 1,
        totalData: count,
        totalPage: 1,
      },
    };
  }

  @Get()
  @ListSwaggerExample(
    ResponseUserInstagramDto,
    'Mengambil Semua Data User Instagram',
  )
  async findAll(
    @Request() req: any,
    @Query() queryParameterDto: FilteringUserInstagramDto,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramDto>> {
    const { page = 1, limit = 10 } = queryParameterDto;
    const [result, total] =
      await this.userInstagramService.findAndCount(queryParameterDto);

    return {
      data: plainToInstance(ResponseUserInstagramDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page: page,
        totalData: total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id/post-instagram')
  @DetailSwaggerExample(
    ResponseUserInstagramDto,
    'Mengambil seluruh data Post Instagram dari User Instagram',
  )
  async findOnePostInstagram(
    @Request() req: any,
    @Param() pathParameter: PathParameterDto,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramDto>> {
    const result = await this.userInstagramService.findOneBy({
      where: { id: pathParameter.id },
      relations: ['postInstagram'],
    });

    return {
      data: plainToInstance(ResponseUserInstagramDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @DetailSwaggerExample(
    ResponseUserInstagramDto,
    'Mengambil satu data User Instagram',
  )
  async findOne(
    @Request() req: any,
    @Param() pathParameter: PathParameterDto,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramDto>> {
    const result =
      await this.userInstagramService.findOneByOrFail(pathParameter);

    return {
      data: plainToInstance(ResponseUserInstagramDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @DetailSwaggerExample(
    ResponseUserInstagramDto,
    'Mengupdate satu data User Instagram',
  )
  async update(
    @Param() pathParameter: PathParameterDto,
    @Body() updateDto: UpdateUserInstagramDto,
    @Request() req: any,
  ): Promise<BaseSuccessResponse<ResponseUserInstagramDto>> {
    const result = await this.userInstagramService.update(
      pathParameter,
      updateDto,
      req.user,
    );

    return {
      data: plainToInstance(ResponseUserInstagramDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @DeleteSwaggerExample('Menghapus satu data User Instagram', '')
  async remove(
    @Param() pathParameter: PathParameterDto,
    @Request() req: any,
  ): Promise<UpdateResult> {
    return await this.userInstagramService.remove(pathParameter, req.user);
  }
}
