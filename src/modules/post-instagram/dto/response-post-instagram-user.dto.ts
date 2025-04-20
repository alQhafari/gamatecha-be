import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Caption {
  @ApiPropertyOptional()
  @Expose()
  text: string;

  @ApiPropertyOptional({
    isArray: true,
  })
  @Expose()
  hashtags: string[];
}

export class UserRapidApi {
  @ApiPropertyOptional()
  @Expose()
  id: string;

  @ApiPropertyOptional()
  @Expose()
  username: string;

  @ApiPropertyOptional()
  @Expose()
  profile_pic_url: string;
}

export class ResponsePostInstagramUserDto {
  @ApiPropertyOptional()
  @Expose()
  caption: Caption;

  @ApiPropertyOptional()
  @Expose()
  code: string;

  @ApiPropertyOptional()
  @Expose()
  thumbnail_url: string;

  @ApiPropertyOptional()
  @Expose()
  user: UserRapidApi;
}
