import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { User } from '../../common/user/entities/user.entity';

export default class UserSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    await dataSource.query('TRUNCATE "users" RESTART IDENTITY;');

    const repository = dataSource.getRepository(User);
    const admin = repository.create({
      username: 'superadmin',
      email: 'superadmin@gmail.com',
      password: 'superadmin@123',
      isAdmin: true,
    });

    await repository.save(admin);
  }
}
