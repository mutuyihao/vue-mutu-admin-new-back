import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Llm } from 'src/llm/entities/llm.entity';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule { }
