import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity } from 'src/database/entity/booking.entity';
import { Repository } from 'typeorm';
import { BookingDto } from './dto/booking.dto';
import * as apm from 'elastic-apm-node';
import { Redis } from 'ioredis';
import { GoodsEntity } from 'src/database/entity/goods.entity';

@Injectable()
export class BookingService {
  private container: any[] = [];
  private bookingLimit: number;
  private bookingCount: number;

  constructor(
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(GoodsEntity)
    private goodsRepository: Repository<GoodsEntity>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {
    this.redisClient = redisClient;
    setInterval(() => this.containerToDatabase(), 5000); // 5초 간격으로 리스트 DB에 저장
  }

  async saveToContainer(booking) {
    // console.log(booking);
    const cachedBookingCount = await this.redisClient.get(
      `goodsId:${booking.goodsId}`,
    );
    const cachedBookingLimit = await this.redisClient.get(
      `bookingLimitOfGoodsId:${booking.goodsId}`,
    );

    // 캐시되어 업데이트 중인 bookingcount + 현재 container 안에 데이터 갯수 > bookingLimit
    if (cachedBookingCount + this.container.length > cachedBookingLimit) {
      await this.createBooking(booking);
    } else {
      // 컨테이너에 바로 booking 데이터 푸시
      this.container.push(booking);
    }
  }

  async containerToDatabase() {
    if (this.container.length > 0) {
      await this.createBooking(this.container);
      // this.bookingCount += this.container.length; //! 수정 로직
      this.container = []; // 작업을 처리하면 리스트 초기화
    }
  }

  async createBooking(container) {
    // console.log('container:', container);

    const trans = apm.startTransaction('createBooking');
    // const cacheSpan = apm.startSpan('cacheSpan');
    const cachedBookingCount = await this.redisClient.get(
      `goodsId:${container[0].goodsId}`,
    );
    const cachedBookingLimit = await this.redisClient.get(
      `bookingLimitOfGoodsId:${container[0].goodsId}`,
    );

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
        .where('id=:id', { id: Number(container[0].goodsId) })
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
    if (bookingCount > bookingLimit) {
      await this.redisClient.lpush(
        `waitlist:${container[0].goodsId}`,
        container[0].userId,
      );
      return { message: '예매가 초과되어 대기자 명단에 등록 되었습니다' };
    }
    // compareSpan.end();

    // 3. 예매 진행
    // const bookingSpan = apm.startSpan('BookingSpan');

    // {goodsId: container.goodsId,userId: container.userId} -> this.container

    if (this.container.length === 1) {
      await this.bookingRepository
        .createQueryBuilder()
        .insert()
        .into(BookingEntity)
        .values({ goodsId: container[0].goodsId, userId: container[0].userId })
        .execute();
    } else {
      await this.bookingRepository
        .createQueryBuilder()
        .insert()
        .into(BookingEntity)
        .values(this.container)
        .execute();
    }

    // bookingSpan.end();

    // //! 기존 로직은 1씩 증가
    // await this.redisClient.incr(`goodsId:${container.goodsId}`);

    //* 수정된 로직은 container 길이 만큼 증가
    await this.redisClient.incrby(
      `goodsId:${container[0].goodsId}`,
      this.container.length,
    );

    trans.end();

    return true;
  }
}
