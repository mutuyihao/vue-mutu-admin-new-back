import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}
  create(createRoleDto: CreateRoleDto) {
    const routes = createRoleDto?.routes ? createRoleDto.routes : [];
    // const permissions = createRoleDto?.permissions?createRoleDto.permissions:[]
    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        routes: {
          connectOrCreate: routes.map((route) => ({
            where: { name: route },
            create: { name: route },
          })),
        },
      },
    });
  }

  async findAll(pagination?: { skip: number; take: number }) {
    const [total, data] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.findMany({
        ...pagination,
        include: {
          routes: true,
        },
      }),
    ]);
    return { total, data };
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      const existingRoutes = await this.prisma.route.findMany({
        where: { name: { in: updateRoleDto.routes } },
      });
      const missingRoutes = updateRoleDto.routes!.filter(
        (route) => !existingRoutes.some((r) => r.name === route),
      );
      if (missingRoutes.length > 0) {
        await this.prisma.route.createMany({
          data: missingRoutes.map((route) => ({ name: route })),
        });
      }
      const routes = updateRoleDto?.routes?.map((item) => ({ name: item }));
      return this.prisma.role.update({
        where: { id },
        data: {
          name: updateRoleDto.name,
          description: updateRoleDto.description,
          routes: {
            set: routes,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
