import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { S3Service } from './s3.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, S3Service],
  exports: [AssetsService, S3Service],
})
export class AssetsModule {}

