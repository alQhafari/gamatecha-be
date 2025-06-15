import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUniquenessInstagramPk1750009954421
  implements MigrationInterface
{
  name = 'ChangeUniquenessInstagramPk1750009954421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ALTER COLUMN "instagramPk" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" DROP CONSTRAINT "UQ_3858869f600cd7392bb19e0db6c"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_instagram_instagramPk" ON "post_instagram" ("instagramPk") WHERE "deletedAt" IS NULL AND "deletedBy" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_instagram_instagramPk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ADD CONSTRAINT "UQ_3858869f600cd7392bb19e0db6c" UNIQUE ("instagramPk")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ALTER COLUMN "instagramPk" SET NOT NULL`,
    );
  }
}
