import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { encrptPassword, omit } from 'src/util';
@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) { }
  async login(username: string, password: string) {
    const user = await this.userService.findOne({ username });

    if (!user) {
      throw new NotFoundException(`用户 ${username} 不存在`);
    }
    if (user.password !== encrptPassword(password)) {
      throw new UnauthorizedException(`密码错误`);
    }
    if (user && user.password === encrptPassword(password)) {
      const payload = { username: user.username, userId: user.id, role: user.role!.name };
      const access_token = await this.generateToken(payload);
      return { ...omit(user, ['password']), access_token };
    }
  }

  async register(data: { name: string, username: string, email: string, password: string, roleName?: string }) {
    const user = await this.userService.create({ name: data.name, username: data.username, email: data.email, password: data.password, roleName: data.roleName });
    const payload = { username: user.username, userId: user.id, role: user.role!.name };
    const access_token = await this.generateToken(payload);
    return { user: { ...omit(user, ['password']) }, access_token };
  }
  private async generateToken(payload: { username: string, userId: number, role: string, [key: string]: any }) {
    return this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
  }
}
