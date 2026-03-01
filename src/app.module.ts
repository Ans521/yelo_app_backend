import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JWT_SECRET } from './constants';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { OptionalMulterMiddleware } from './middleware/optional-multer.middleware';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    DatabaseModule,
    RedisModule,
    CoreModule,
    OtpModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OptionalMulterMiddleware)
      .forRoutes({ path: 'api/add-business', method: RequestMethod.POST });
    // upload-image multer runs in main.ts so it sees correct Content-Type before other middleware
  }
}
