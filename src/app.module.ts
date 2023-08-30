import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { RedisModule } from './redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/data-source';
import { ApmInterceptor } from './interceptor/apm.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';

const configService = new ConfigService();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    BookingModule,
    BullModule.forRootAsync({
      imports: [RedisModule], // add RedisModule here
      inject: ['REDIS_CLIENT'], // inject REDIS_CLIENT provider
      useFactory: (redisClient: any) => ({
        redis: redisClient,
      }),
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ApmInterceptor,
    },
    AppService,
  ],
})
export class AppModule {}
