import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ConfigService } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // DB commented for now
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     host: configService.get<string>('DB_HOST') ?? 'localhost',
    //     port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
    //     username: configService.get<string>('DB_USERNAME') ?? 'postgres',
    //     // pg driver requires password to be a string (never undefined)
    //     password: configService.get<string>('DB_PASSWORD') ?? '',
    //     database: configService.get<string>('DB_DATABASE') ?? 'yelo_app',
    //     autoLoadEntities: true,
    //     synchronize: configService.get<string>('NODE_ENV') !== 'production',
    //   }),
    //   inject: [ConfigService],
    // }),
    RedisModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
