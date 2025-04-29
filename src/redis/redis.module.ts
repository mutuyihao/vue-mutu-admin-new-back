import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: 'localhost',
          port: 6379,
        }),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
