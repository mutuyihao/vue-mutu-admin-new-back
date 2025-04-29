import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 使 PrismaService 可在整个项目中使用
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule { }