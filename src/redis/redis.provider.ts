// import { ConfigService } from '@nestjs/config';
// import { Redis } from 'ioredis';
// const configService = new ConfigService();

// export const redisProvider = [
//   {
//     // Redis를 Provide로 주입하기 위한 Token
//     provide: 'REDIS_CLIENT',
//     // useFactory 구문을 사용하여 동적으로 Provider를 만드는 작업
//     // Provider는 인수를 받고 팩토리 함수에서 반환된 값으로 제공한다.
//     useFactory: async () => {
//       const redis = new Redis({
//         // Redis Config 설정
//         host: configService.get<string>('REDIS_HOST'),
//         port: configService.get<number>('REDIS_PORT'),
//         password: configService.get<string>('REDIS_PASSWORD'),
//       });
//       // 연결 상태 확인용 PING-PONG
//       const connect = await redis.ping();
//       if (connect === 'PONG') console.log('REDIS Connect!');
//       return redis;
//     },
//   },
// ];

//! 레디스 클러스터링 설정
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
const configService = new ConfigService();

export const redisProvider = [
  {
    provide: 'REDIS_CLIENT',
    useFactory: () => {
      const nodes = [
        {
          host: configService.get<string>('REDIS_HOST_1'),
          port: configService.get<number>('REDIS_PORT_1'),
        },
        {
          host: configService.get<string>('REDIS_HOST_2'),
          port: configService.get<number>('REDIS_PORT_2'),
        },
        {
          host: configService.get<string>('REDIS_HOST_3'),
          port: configService.get<number>('REDIS_PORT_3'),
        },
        {
          host: configService.get<string>('REDIS_HOST_4'),
          port: configService.get<number>('REDIS_PORT_4'),
        },
        {
          host: configService.get<string>('REDIS_HOST_5'),
          port: configService.get<number>('REDIS_PORT_5'),
        },
        {
          host: configService.get<string>('REDIS_HOST_6'),
          port: configService.get<number>('REDIS_PORT_6'),
        },
      ];

      const options = {
        redisOptions: {
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      };

      const cluster = new Redis.Cluster(nodes);
      console.log(cluster);
      // const cluster = new Redis.Cluster(nodes, options);

      // cluster.on('connect', () => {
      //   console.log('REDIS Cluster Connect!');
      // });

      cluster.on('error', (err) => {
        console.log('Redis Cluster Error: ', err);
      });

      // 이벤트에 대한 일회성 리스너를 등록합니다. 이 리스너는 이벤트가 처음 발생할 때만 호출되며 그 이후에는 등록이 취소됩니다.
      cluster.once('connect', async () => {
        const pong = await cluster.ping();
        if (pong) {
          console.log('Cluster pinged:', pong);
        }
      });

      // setInterval(async () => {
      //   const pong = await cluster.ping();
      //   if (pong) {
      //     console.log('Cluster is still connected:', pong);
      //   } else {
      //     console.log('Cluster connection might be lost');
      //   }
      // }, 5000);

      return cluster;
    },
  },
];
