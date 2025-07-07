import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeUniquenessInstagramCode1750010691216 implements MigrationInterface {
    name = 'ChangeUniquenessInstagramCode1750010691216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_instagram" ALTER COLUMN "code" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_instagram" DROP CONSTRAINT "UQ_6ee5bb70c21189dc81e85d77ac6"`);
        await queryRunner.query(`CREATE INDEX "IDX_post_instagram_code" ON "post_instagram" ("code") WHERE "deletedAt" IS NULL AND "deletedBy" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_post_instagram_code"`);
        await queryRunner.query(`ALTER TABLE "post_instagram" ADD CONSTRAINT "UQ_6ee5bb70c21189dc81e85d77ac6" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "post_instagram" ALTER COLUMN "code" SET NOT NULL`);
    }

}
