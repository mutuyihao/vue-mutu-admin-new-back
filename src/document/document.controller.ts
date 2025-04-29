import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LlmService } from 'src/llm/llm.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pgvector from 'pgvector'

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService, private llmService: LlmService, private prisma: PrismaService) {
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file',
    // {
    // storage: diskStorage({
    //   destination: './upload', // <-- 目标文件夹
    //   filename: (req, file, callback) => {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    //     const ext = extname(file.originalname);
    //     callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    //   },
    // }),
    // }
  ))
  async uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1 }),
        new FileTypeValidator({ fileType: 'text/plain' }),
      ],
    }),
  ) file: Express.Multer.File) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const document = await this.prisma.document.create({ data: { name: file.originalname, fileUrl: "", } });
    this.processDocument(file, document.id);
    return file
  }

  async processDocument(file: Express.Multer.File, documentId: string) {
    const text = file.buffer.toString(); // 或者从 file.path 读取
    const chunks = this.splitTextIntoChunks(text, 8092);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const embedding = await this.llmService.getEmbedding(chunk);
      // const float32Array = new Float32Array(embedding.data[0].embedding);
      // const buffer = Buffer.from(float32Array.buffer);
      const embeddingArray = pgvector.toSql(embedding.data[0].embedding)

      const chunkData = await this.prisma.documentChunk.create({
        data: {
          documentId, // 替换为你的文档 ID
          index: i,
          content: chunk,
        },
      });
      await this.prisma.$executeRawUnsafe(`
  UPDATE "DocumentChunk"
  SET embedding = '${embeddingArray}'::vector
  WHERE id = '${chunkData.id}';
`);
    }
  }
  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentService.create(createDocumentDto);
  }

  @Get()
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentService.update(+id, updateDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}
