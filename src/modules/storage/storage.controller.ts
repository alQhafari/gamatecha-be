import { ObjectCannedACL } from '@aws-sdk/client-s3';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseSuccessResponse } from '../../common/response/base.response';
import { CreateSwaggerExample } from '../../common/swagger/swagger-example.response';
import { ResponseStorageDto } from './dto/response-storage.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @CreateSwaggerExample(
    UploadFileDto,
    ResponseStorageDto,
    false,
    'Mengupload File',
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseSuccessResponse<ResponseStorageDto>> {
    try {
      const url = await this.storageService.uploadFile(
        file,
        ObjectCannedACL.public_read,
      );
      return {
        data: plainToInstance(
          ResponseStorageDto,
          { url: url },
          {
            excludeExtraneousValues: false,
          },
        ),
      };
    } catch (err) {
      throw err;
    }
  }
}
