import { Module } from '@nestjs/common';
import { AppCoreController } from './app-core.controller';
import { AppCoreService } from './app-core.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [AppCoreController],
  providers: [AppCoreService],
  exports: [AppCoreService],
})
export class CoreModule {}
