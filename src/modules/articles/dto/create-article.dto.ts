import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ArticleStatus } from '../../../common/enum/status.enum';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  mediaUrl: string;

  @ApiPropertyOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus = ArticleStatus.ARCHIVED;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  postInstagram_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  categories?: string[];
}
