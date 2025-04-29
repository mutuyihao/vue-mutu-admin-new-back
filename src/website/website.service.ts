import { GatewayTimeoutException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Redis from 'ioredis';
@Injectable()
export class WebsiteService {
  weatherKey: string;
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly httpService: HttpService,
  ) {
    this.weatherKey = process.env.QWEATHER_KEY!;
  }
  async nowWeather(cityName: string) {
    const city = await this.geoLocation(cityName);
    const cityId = city.location[0].id;
    const [weather, air, html] = await Promise.all([
      axios
        .get(
          'https://ka36x42aw6.re.qweatherapi.com/v7/weather/now?location=' +
            cityId,
          {
            headers: {
              'X-QW-Api-Key': `${this.weatherKey}`,
            },
          },
        )
        .then((res) => res.data)
        .catch((err) => {
          if (err) {
            throw new GatewayTimeoutException('调用第三方服务超时');
          }
        }),
      axios
        .get(
          'https://ka36x42aw6.re.qweatherapi.com/v7/air/now?location=' + cityId,
          {
            headers: {
              'X-QW-Api-Key': `${this.weatherKey}`,
            },
          },
        )
        .then((res) => res.data)
        .catch((err) => {
          if (err) {
            throw new GatewayTimeoutException('调用第三方服务超时');
          }
        }),
      axios
        .get(city.location[0].fxLink, {
          headers: {
            'X-QW-Api-Key': `${this.weatherKey}`,
          },
        })
        .then((res) => res.data)
        .catch((err) => {
          if (err) {
            throw new GatewayTimeoutException('调用第三方服务超时');
          }
        }),
    ]);
    const abstract = cheerio.load(html)('.current-abstract').text();
    return { weather: { ...weather.now, abstract }, air: air.now };
  }

  geoLocation(cityName: string) {
    return axios
      .get(
        'https://ka36x42aw6.re.qweatherapi.com//geo/v2/city/lookup?location=' +
          cityName,
        {
          headers: {
            'X-QW-Api-Key': `${this.weatherKey}`,
          },
        },
      )
      .then((res) => res.data)
      .catch((err) => {
        if (err) {
          throw new GatewayTimeoutException('调用第三方服务超时');
        }
      });
  }

  async addTodayViewCount() {
    const key = this.getDayStartTimestamp(0);
    const monthKey = this.getMonth();
    try {
      const tx = this.redisClient.multi();
      tx.incr(key);
      tx.incr(monthKey);
      const result = await tx.exec();
    } catch (error) {
      console.error(`[Redis] Failed to increment view count for :`, error);
    }
  }
  async getTodayViewCount() {
    const key = this.getDayStartTimestamp(0);
    try {
      const count = await this.redisClient.get(key);
      return count ?? 0;
    } catch (error) {
      console.error(`[Redis] Failed to get view count for :`, error);
    }
    return 0;
  }
  async getDaysViewCount(days: number) {
    const daysList = this.getRecentDaysStartTimestamps(days);
    try {
      const daysView = (await this.redisClient.mget(daysList)).map(
        (item, index) => {
          const value = item ? item : 0;
          return {
            date: this.formatDateToYMD(new Date(Number(daysList[index]))),
            views: value,
          };
        },
      );
      return daysView;
    } catch (error) {
      console.error(`[Redis] Failed to get view count for :`, error);
    }
  }
  async getMonthsViewCount(months: number) {
    const monthsList = this.getRecentMonths(months);
    try {
      const daysView = (await this.redisClient.mget(monthsList)).map(
        (item, index) => {
          const value = item ? item : 0;
          return {
            date: monthsList[index],
            views: value,
          };
        },
      );
      return daysView;
    } catch (error) {
      console.error(`[Redis] Failed to get months view count for :`, error);
    }
  }
  private getDayStartTimestamp(offset = 0): string {
    const now = new Date();
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset,
    );
    return date.getTime().toString();
  }

  private getRecentDaysStartTimestamps(days: number): string[] {
    return Array.from({ length: days }, (_, i) =>
      this.getDayStartTimestamp(days - i - 1),
    );
  }
  private formatDateToYMD(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  private getMonth(offset = 0): string {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - offset);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }
  private getRecentMonths(months: number): string[] {
    const monthsList = [];
    for (let m = 0; m < months; m++) {
      const month = this.getMonth(m);
      monthsList.unshift(month);
    }
    return monthsList;
  }
}
