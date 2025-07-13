import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayloadDto } from 'src/common/dto/jwt-payload.dto';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  QueryRunner,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService extends BaseService<User, CreateUserDto> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {
    super(repository);
  }

  defaultRelation() {
    return [];
  }

  async create(
    createUserDto: CreateUserDto | CreateUserDto[],
    user?: JwtPayloadDto,
    manager?: EntityManager,
  ): Promise<User | User[]> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const instance = await super.create(
        createUserDto,
        user,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return instance;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAndCount(options?: any): Promise<[User[], number]> {
    const { limit, page, orderBy, orderDirection, search, ...query } =
      options || {};
    const findOption: any = {};
    findOption.where = [];

    /* 
      Search
    */
    if (search) {
      findOption.where.push({
        username: ILike(`%${search}%`),
      });
    }

    /* 
      Filtering
    */
    Object.entries(query).forEach(([key, value]) => {
      const condition: any = {};
      if (key.includes('_')) {
        const [relationName, relationKey] = key.split('_');
        condition[relationName] = { [relationKey]: value };
        findOption.where.push(condition);
      } else {
        condition[key] = value;
        findOption.where.push(condition);
      }
    });

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
    option: FindOptionsWhere<User> | FindOptionsWhere<User>[],
    updateDto: UpdateUserDto,
    user?: JwtPayloadDto,
  ): Promise<User | User[]> {
    const _updateDto: any = updateDto;

    // const { userExtend } = updateDto;
    // if (userExtend) {
    //   const userExtendInstance = await this.userExtendService.findOneBy({
    //     where: { user: option },
    //   });
    //   const updatedUserExtend = Object.assign(userExtendInstance, {
    //     ...userExtend,
    //   });

    //   _updateDto.userExtend = updatedUserExtend;
    // }

    return await super.update(option, _updateDto, user);
  }
}
