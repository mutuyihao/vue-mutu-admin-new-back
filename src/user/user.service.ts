import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { encrptPassword, omit } from 'src/util';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }
  findOne(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where, include: { role: { include: { routes: true, permissions: true } } } });
  }
  async findAll(pagination: { skip: number; take: number }) {
    const [total,data]=await Promise.all([this.prisma.user.count(),this.prisma.user.findMany({...pagination,include:{role:{include:{routes:true,permissions:true}}}})])
    return {total,data}
  }
  async create(data: CreateUserDto) {
    const existUser = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existUser) {
      throw new ConflictException(`用户 ${data.username} 已存在`);
    }
    let role;
    if (!data.roleId) {
      data.roleName = 'USER'
      role = await this.prisma.role.findUnique({ where: { name: data.roleName } });
    }else{
      role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
    }
    data.roleId = role!.id;
    const user = await this.prisma.user.create({ data: {name:data.name,username:data.username,email:data.email,role:{connect:{id:data.roleId}}, password: encrptPassword(data.password) }, include: { role: { include: { routes: true, permissions: true } } } });
    if (!user) {
      throw new InternalServerErrorException(`用户 ${data.username} 创建失败`);
    }
    return user;
  }
  async update(id: number, data: UpdateUserDto) {
    const existUser = await this.prisma.user.findUnique({ where: { username: data.username } });
    if(data.password && data.password===existUser?.password){
      await this.prisma.user.update({ where: { id }, data: { name: data.name, email: data.email, role:{connect:{id:data.roleId}}}, include: { role: { include: { routes: true, permissions: true } } } });
    }else{
      await this.prisma.user.update({ where: { id }, data: { name: data.name, email: data.email, role:{connect:{id:data.roleId}}, password: encrptPassword(data.password!) }, include: { role: { include: { routes: true, permissions: true } } } });
    }
    return true
  }
}
