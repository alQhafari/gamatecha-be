import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUniquenessInstagramID1750010442176
  implements MigrationInterface
{
  name = 'ChangeUniquenessInstagramID1750010442176';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ALTER COLUMN "instagramId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" DROP CONSTRAINT "UQ_6dd5223c867e909a7be507950b3"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_instagram_instagramId" ON "post_instagram" ("instagramId") WHERE "deletedAt" IS NULL AND "deletedBy" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_post_instagram_instagramId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ADD CONSTRAINT "UQ_6dd5223c867e909a7be507950b3" UNIQUE ("instagramId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_instagram" ALTER COLUMN "instagramId" SET NOT NULL`,
    );
  }
}
