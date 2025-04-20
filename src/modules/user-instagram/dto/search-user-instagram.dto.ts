import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchUserInstagramDto {
  @ApiProperty({
    description: 'Username Instagram',
    example: 'instagram',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
