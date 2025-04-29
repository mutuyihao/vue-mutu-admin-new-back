import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Public } from './auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  login(@Body() { username, password }: { username: string, password: string }) {
    return this.authService.login(username, password);
  }

  @Public()
  @Post('/register')
  register(@Body() data: {name:string, username: string, email: string, password: string, roleId: number }) {
    return this.authService.register(data);
  }
}
