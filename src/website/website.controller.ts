import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { WebsiteService } from './website.service';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { Public } from 'src/auth/auth.decorator';

@Controller('website')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('/weather/:cityName')
  getTodayCityWeather(@Param('cityName') cityName: string) {
    return this.websiteService.nowWeather(cityName);
  }

  @Put('/views')
  addTodayViewCount() {
    return this.websiteService.addTodayViewCount();
  }

  @Get('/views')
  getTodayViewCount() {
    return this.websiteService.getTodayViewCount();
  }
  @Get('/views/:days')
  getDaysViewCount(@Param('days') days: number) {
    return this.websiteService.getDaysViewCount(days);
  }
  @Get('/monthViews/:months')
  getMonthsViewCount(@Param('months') months: number) {
    return this.websiteService.getMonthsViewCount(months);
  }
}
