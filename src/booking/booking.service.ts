import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity } from 'src/database/entity/booking.entity';
import { Repository } from 'typeorm';
import { BookingDto } from './dto/booking.dto';
import * as apm from 'elastic-apm-node';
import { Redis } from 'ioredis';
import { GoodsEntity } from 'src/database/entity/goods.entity';

@Injectable()
export class BookingService implements OnModuleInit {
  constructor(
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(GoodsEntity)
    private goodsRepository: Repository<GoodsEntity>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {
    this.redisClient = redisClient;
  }
  async onModuleInit() {
    // Redis Stream을 처리하기 위한 로직을 여기에서 시작합니다.
    this.processStream();
  }

  async processStream() {
    // 1. 스트림 및 그룹 식별자 부여
    const streamName = 'bookingStream'; // Pub에서 보내는 이름과 같게
    const groupName = 'bookingGroup';
    const consumer = 'consumer-1';

    // 2. Consumer Group 생성
    try {
      await this.redisClient.xgroup(
        'CREATE',
        streamName,
        groupName,
        '$',
        'MKSTREAM',
      );
    } catch (err) {
      if (
        !err.message.includes('BUSYGROUP Consumer Group name already exists')
      ) {
        console.error(err);
      }
    }

    // 3.메세지를 계속 읽기
    while (true) {
      const entries = await this.redisClient.xreadgroup(
        'GROUP', // 소비자 그룹에서 읽기 작업
        groupName, // 소비자 그룹 이름
        consumer, // 소비자 그룹내의 소비자 이름임.
        'BLOCK', // 읽을 메시지가 더 이상 없으면 새 메시지가 도착 하거나 지정된 시간 초과가 발생할 때까지 호출이 차단(대기)됨
        5000, //
        'STREAMS',
        streamName,
        '>',
      );

      if (entries) {
        console.log(entries);
        const streamEntires = entries[0][1];
        console.log('streamEntires:', streamEntires);
        for (const [id, entry] of streamEntires) {
          console.log(id, entry);
          const booking = JSON.parse(entry[1]);
          console.log('booking:', booking);
          await this.createBooking(booking);
          await this.redisClient.xack(streamName, groupName, id);
        }
      }
    }
  }

  async createBooking(booking) {
    const trans = apm.startTransaction('createBooking');
    // const cacheSpan = apm.startSpan('cacheSpan');
    const cachedBookingCount = await this.redisClient.get(
      `goodsId:${booking.goodsId}`,
    );
    const cachedBookingLimit = await this.redisClient.get(
      `bookingLimitOfGoodsId:${booking.goodsId}`,
    );
    console.log('bookinggg:', booking);
    let bookingCount: number;
    let bookingLimit: number;
    if (!cachedBookingCount || !cachedBookingLimit) {
      const findGoods = await this.goodsRepository
        .createQueryBuilder()
        .select([
          'GoodsEntity.id',
          'GoodsEntity.bookingLimit',
          'GoodsEntity.bookingCount',
        ])
        .where('id=:id', { id: Number(booking.goodsId) })
        .getOne();

      bookingCount = findGoods.bookingCount;
      bookingLimit = findGoods.bookingLimit;
      await this.redisClient.set(
        `bookingLimitOfGoodsId:${findGoods.id}`,
        bookingLimit,
      );
    } else {
      // 레디스에서 가져온 데이터 타입은 스트링이므로 숫자로 변환
      bookingCount = +cachedBookingCount;
      bookingLimit = +cachedBookingLimit;
    }
    // cacheSpan.end();

    // const compareSpan = apm.startSpan();
    // 2. 좌석이 없는 경우 대기자 명단으로 등록
    if (Number(cachedBookingCount) >= Number(cachedBookingLimit)) {
      await this.redisClient.lpush(
        `waitlist:${booking.goodsId}`,
        booking.userId,
      );
      return { message: '예매가 초과되어 대기자 명단에 등록 되었습니다' };
    }
    // compareSpan.end();

    // 3. 예매 진행
    // const bookingSpan = apm.startSpan('BookingSpan');
    await this.bookingRepository
      .createQueryBuilder()
      .insert()
      .into(BookingEntity)
      .values({
        goodsId: booking.goodsId,
        userId: booking.userId,
      })
      .execute();
    // bookingSpan.end();
    await this.redisClient.incr(`goodsId:${booking.goodsId}`);
    trans.end();

    return true;
  }
}
