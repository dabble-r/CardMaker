import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [PrismaModule, AssetsModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}

