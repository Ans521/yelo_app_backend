import { Module } from '@nestjs/common';
import { AppCoreController } from './app-core.controller';
import { AppCoreService } from './app-core.service';

@Module({
  controllers: [AppCoreController],
  providers: [AppCoreService],
  exports: [AppCoreService],
})
export class CoreModule {}
