import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCascadeArticle1749396705892 implements MigrationInterface {
  name = 'ChangeCascadeArticle1749396705892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_categories_category" DROP CONSTRAINT "FK_4ba35bcb36b2715f61faa696c7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_categories_category" ADD CONSTRAINT "FK_4ba35bcb36b2715f61faa696c7e" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_categories_category" DROP CONSTRAINT "FK_4ba35bcb36b2715f61faa696c7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_categories_category" ADD CONSTRAINT "FK_4ba35bcb36b2715f61faa696c7e" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}
