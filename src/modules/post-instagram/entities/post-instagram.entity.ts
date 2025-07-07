import { Column, Entity, Index, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entity/base.entity';
import { Article } from '../../articles/entities/article.entity';
import { MediaType } from '../../media-type/entities/media-type.entity';
import { UserInstagram } from '../../user-instagram/entities/user-instagram.entity';

@Entity()
@Index('IDX_post_instagram_instagramPk', ['instagramPk'], {
  unique: false,
  where: '"deletedAt" IS NULL AND "deletedBy" IS NULL',
})
@Index('IDX_post_instagram_instagramId', ['instagramId'], {
  unique: false,
  where: '"deletedAt" IS NULL AND "deletedBy" IS NULL',
})
@Index('IDX_post_instagram_code', ['code'], {
  unique: false,
  where: '"deletedAt" IS NULL AND "deletedBy" IS NULL',
})
export class PostInstagram extends BaseEntity {
  @Column({ unique: false, nullable: true })
  instagramPk: string = '';

  @Column({ unique: false, nullable: true })
  instagramId: string = '';

  @Column({ unique: false, nullable: true })
  code: string = '';

  @Column()
  takenAt: Date = new Date();

  @Column({ nullable: false })
  thumbnailUrl: string = '';

  @Column({ nullable: false })
  mediaUrl: string = '';

  @Column({ nullable: false })
  caption: string = '';

  @Column()
  postUrl: string = '';

  @ManyToOne(() => MediaType, (mediaType) => mediaType.postInstagram, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  mediaType: number | null = null;

  @ManyToOne(
    () => UserInstagram,
    (userInstagram) => userInstagram.postInstagram,
    {
      cascade: true,
      nullable: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  user: UserInstagram | null = null;

  @OneToOne(() => Article, (article) => article.postInstagram, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  article: Article | null = null;
}
