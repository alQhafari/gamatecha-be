import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseUserInstagramRapidApi {
  @ApiProperty()
  @Expose()
  full_name: string;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  is_private: boolean;

  @ApiProperty()
  @Expose()
  is_verified: boolean;

  @ApiProperty()
  @Expose()
  profile_pic_url: string;

  @ApiProperty()
  @Expose()
  username: string;
}
