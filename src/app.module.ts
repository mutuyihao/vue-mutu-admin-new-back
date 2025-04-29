import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { LlmModule } from './llm/llm.module';
import { DocumentModule } from './document/document.module';
import { WebsiteModule } from './website/website.module';
import { RedisModule } from './redis/redis.module';
@Module({
  imports: [UserModule, AuthModule, PrismaModule, RoleModule, ConversationModule, MessageModule, LlmModule, DocumentModule, WebsiteModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
