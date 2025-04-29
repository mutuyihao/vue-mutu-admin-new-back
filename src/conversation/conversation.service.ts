import { Injectable, Res } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LlmService } from 'src/llm/llm.service';
import { ServerResponse } from 'node:http';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
  ) {}
  async create(
    @Res() res: ServerResponse,
    user: JWTPayload['user'],
    createConversationDto: CreateConversationDto,
  ) {
    // 设置 SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const isCreateConversation = createConversationDto.id ? false : true;
    const postPrompt = isCreateConversation
      ? '\n 请回答用户问题,并简略总结用户问题为title,但不要在推理(深度思考)中显示相关要求,并按以下格式回复: 回答:<内容> \n 标题:<title>'
      : '';
    const prefixPrompt = await this.vectorRetrieval(
      createConversationDto.messages[0].content,
    );
    // const prefixPrompt = '';
    let responseBody: ReadableStream<Uint8Array<ArrayBufferLike>> | null = null;
    responseBody = await this.llmService.streamChat(
      prefixPrompt + createConversationDto.messages[0].content + postPrompt,
    );

    // 消费 SSE 响应
    let buffer = '';
    const reader = responseBody!.getReader();
    const encoder = new TextDecoder();
    let isDone = false;
    let reasoning_content = '';
    let content = '';
    while (!isDone) {
      const { done, value } = await reader.read();
      // res.write(encoder.decode(value));
      // console.log(encoder.decode(value));
      isDone = done;
      if (!isDone) buffer += encoder.decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data) {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.choices[0].delta.reasoning_content) {
                reasoning_content +=
                  parsedData.choices[0].delta.reasoning_content;
                let tempRes = JSON.stringify({
                  reasoning_content:
                    parsedData.choices[0].delta.reasoning_content,
                });
                res.write(`event: message\ndata: ${tempRes}\n\n`);
              }
              if (parsedData.choices[0].delta.content) {
                content += parsedData.choices[0].delta.content;
                let tempRes = JSON.stringify({
                  content: parsedData.choices[0].delta.content,
                });
                res.write(`event: message\ndata: ${tempRes}\n\n`);
              }
            } catch (error) {
              break;
            }
          }
        }
      }
    }
    createConversationDto.messages[1] = {
      role: 'Ai',
      reasoning_content: reasoning_content,
      content: content,
    };
    const { answer, title } = this.extractAnswerAndTitle(content);
    createConversationDto.messages[1].content = answer;
    let conversation: any;
    if (isCreateConversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          title: title,
          userId: user.userId,
          messages: {
            create: createConversationDto.messages,
          },
        },
        include: {
          messages: true,
        },
      });
    } else {
      conversation = await this.prisma.conversation.update({
        where: {
          id: createConversationDto.id,
        },
        data: {
          title: title,
          userId: user.userId,
          messages: {
            create: createConversationDto.messages,
          },
        },
        include: {
          messages: true,
        },
      });
    }
    res.write(`event: message\ndata: ${JSON.stringify(conversation)}\n\n`);
    res.end();
  }

  findAll(where: Prisma.ConversationWhereInput) {
    return this.prisma.conversation.findMany({
      where: {
        userId: where.userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.conversation.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
      include: {
        messages: true,
      },
    });
  }

  // update(id: number, updateConversationDto: UpdateConversationDto) {
  //   return `This action updates a #${id} conversation`;
  // }

  remove(id: string) {
    return this.prisma.conversation.update({
      where: {
        id: id,
      },
      data: {
        isDeleted: true,
      },
    });
  }
  private async vectorRetrieval(content: string): Promise<string> {
    try {
      const response = await this.llmService.getEmbedding(content);
      const embedding = response.data[0].embedding;
      const similarChunks = await this.prisma.$queryRawUnsafe<
        { content: string }[]
      >(
        `
      SELECT content
      FROM "DocumentChunk"
      ORDER BY embedding <-> $1::vector
      LIMIT 1
    `,
        [...embedding],
      );
      if (!similarChunks.length || similarChunks.length < 1) {
        return '';
      } else {
        return `资料:` + similarChunks.join('\n');
      }
    } catch (error) {
      console.error(error);
      return '';
    }
  }
  private extractAnswerAndTitle(str: string) {
    try {
      const answerRegex = /回答[:：]\s*(.+)/;
      const titleRegex = /标题[:：]\s*(.+)/;

      const answerMatch = str.match(answerRegex);
      const titleMatch = str.match(titleRegex);

      return {
        answer: answerMatch ? answerMatch[1].trim() : str,
        title: titleMatch ? titleMatch[1].trim() : '__new__',
      };
    } catch (error) {
      console.error(error);
      return {
        answer: str,
        title: '__new__',
      };
    }
  }
}

// async create(
//   @Res() res: ServerResponse,
//   user: JWTPayload['user'],
//   createConversationDto: CreateConversationDto,
// ) {
//   const prefixPrompt = await this.vectorRetrieval(
//     createConversationDto.messages[0].content,
//   );
//   if (!createConversationDto.id) {
//     const response = await this.llmService.streamChat(
//       `${prefixPrompt}` +
//         createConversationDto.messages[0].content +
//         '\n 请回答用户问题,并简略总结用户问题为title,并按以下格式回复: 回答:<内容> \n 标题:<title>',
//     );
//     console.log(response.choices[0].message.content);
//     @ts-ignore
//     createConversationDto.messages[1] = {
//       role: 'Ai',
//       content: response.choices[0].message.content,
//     };
//     const responseContent = createConversationDto.messages[1].content;
//     const { answer, title } = this.extractAnswerAndTitle(responseContent);
//     createConversationDto.messages[1].content = answer;
//     const conversation = this.prisma.conversation.create({
//       data: {
//         title: title,
//         userId: user.userId,
//         messages: {
//           create: createConversationDto.messages,
//         },
//       },
//       include: {
//         messages: true,
//       },
//     });
//     return conversation;
//   } else {
//     const response = await this.llmService.chat(
//       `${prefixPrompt}` + createConversationDto.messages[0].content,
//     );
//     createConversationDto.messages[1] = {
//       role: 'Ai',
//       content: response.choices[0].message.content,
//     };
//     const conversation = this.prisma.conversation.update({
//       where: {
//         id: createConversationDto.id,
//       },
//       data: {
//         messages: {
//           create: createConversationDto.messages,
//         },
//       },
//       include: {
//         messages: true,
//       },
//     });
//     return conversation;
//   }
// }
