import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PathParameterUsernameDto {
  @ApiPropertyOptional()
  @IsNotEmpty()
  @Type(() => String)
  username?: string;
}
