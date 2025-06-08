import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayloadDto } from 'src/common/dto/jwt-payload.dto';
import { Category } from 'src/modules/categories/entities/category.entity';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  QueryRunner,
  Repository,
} from 'typeorm';
import { BaseService } from '../../common/service/base.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleService extends BaseService<Article, CreateArticleDto> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {
    super(repository);
  }

  /*
    Default Relationship
  */
  defaultRelation() {
    return ['categories', 'postInstagram'];
  }

  async create(
    createArticleDto: CreateArticleDto | CreateArticleDto[],
    user?: JwtPayloadDto,
    manager?: EntityManager,
  ): Promise<Article | Article[]> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const _createDto: any = Array.isArray(createArticleDto)
        ? createArticleDto[0]
        : createArticleDto;

      const categoriesString = Array.isArray(createArticleDto)
        ? createArticleDto[0].categories
        : createArticleDto.categories;
      const categories = categoriesString?.map((category) => {
        return { name: category };
      });

      _createDto.categories = categories;

      const instances = await super.create(
        _createDto,
        user,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return instances;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAndCount(options?: any): Promise<[Article[], number]> {
    const {
      limit = 10,
      page = 1,
      orderBy,
      orderDirection,
      search,
      ...query
    } = options || {};

    const findOption: any = {};
    findOption.where = {};

    /*
      Search
    */
    if (search) {
      findOption.where = {
        ...findOption.where,
        title: ILike(`%${search}%`),
      };
    }

    /*
      Filtering
    */
    Object.entries(query).forEach(([key, value]) => {
      const condition: any = {};
      if (key.includes('_')) {
        const [relationName, relationKey] = key.split('_');
        condition[relationName] = { [relationKey]: value };
        findOption.where = { ...findOption.where, ...condition };
      } else {
        condition[key] = value;
        findOption.where = { ...findOption.where, ...condition };
      }
    });

    console.log(findOption.where);

    findOption.relations = findOption.relations || this.defaultRelation();

    return await super.findAndCount(
      {
        limit: Number(limit),
        page: Number(page),
        orderBy: orderBy,
        orderDirection: orderDirection,
      },
      findOption,
    );
  }

  async update(
    pathParameter: FindOptionsWhere<Article>,
    updateArticleDto: UpdateArticleDto,
    user: JwtPayloadDto,
    manager?: EntityManager,
  ): Promise<Article> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const articleRepository = queryRunner.manager.getRepository(Article);
      const categoryRepository = queryRunner.manager.getRepository(Category);

      const article = await this.findOneByOrFail(pathParameter);

      let categories = article.categories;
      if (updateArticleDto.categories) {
        categories = await categoryRepository.find({
          where: updateArticleDto.categories.map((name) => ({ name })),
        });
      }

      Object.assign(article, updateArticleDto);

      article.categories = categories;

      await articleRepository.save(article);

      await queryRunner.commitTransaction();
      return article;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
