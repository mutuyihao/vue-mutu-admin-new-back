import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ExecutionContext,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { ServerResponse } from 'node:http';
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req: Request & JWTPayload,
    @Res() res: ServerResponse,
  ) {
    const user = req.user;
    return this.conversationService.create(res, user, createConversationDto);
  }

  @Get()
  findAll(@Req() req: Request & JWTPayload) {
    const user = req.user;
    return this.conversationService.findAll({ userId: user!.userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
  //   return this.conversationService.update(+id, updateConversationDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }
}
