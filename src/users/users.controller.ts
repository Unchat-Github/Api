import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DbUser } from './interfaces/user.interface';
import { UsersService } from './users.service';
import { simpleflake } from 'simpleflakes';
import { io } from 'socket.io-client';

@Controller('users')
export class UserController {
  constructor(private userService: UsersService) {}

  private socket = io('http://localhost:5000/');

  generateSnowflake() {
    return simpleflake(Date.now(), 23 - 200, Date.UTC(2000, 1, 1)).toString();
  }

  async checkAuthToken(token: string) {
    const data = await this.userService._getToken(token);
    return data ? true : undefined;
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Req() req: Request) {
    const data = await this.userService.get({ id });
    if (!data) return { status: 404, message: 'User not found.' };
    if (data) return data;
  }
  @Post('auth')
  async searchUser(
    @Body() query: { username: string; password: string },
    @Req() req: Request,
  ) {
    const { authorization } = req.headers;
    const token = await this.userService._getToken(authorization);
    if (!token) return { status: 401, message: 'Forbbiden' };
    const user = await this.userService.get(query);
    if (!user) return { status: 404, message: 'User not found' };
    if (user) return user;
  }

  @Patch(':id')
  async editUser(
    @Param('id') id: string,
    @Body()
    {
      username,
      avatar,
      status,
    }: { username: string; avatar: string; status: string },
    @Req() req: Request,
  ) {
    const { authorization } = req.headers;
    const token = await this.userService._getToken(authorization);
    if (!token) return { status: 401, message: 'Forbbiden' };

    const user = await this.userService.get({ id });
    if (!user) return { status: 404, message: 'User not found.' };

    if (!username && !avatar && !status)
      return { status: 400, message: 'Bad body request' };

    const data = await this.userService.edit(id, {
      username: username ? username : user.username,
      avatar: avatar ? avatar : user.avatar,
      status: status ? status : user.status,
    });

    return data;
  }

  @Post()
  async createUser(@Body() body: DbUser, @Req() req: Request) {
    const { authorization } = req.headers;
    const data = await this.userService._getToken(authorization);
    if (!data) return { status: 401, message: 'Forbbiden' };
    if (data) {
      if (!body || !body.username || !body.email || !body.password)
        return { status: 404, message: 'Bad body request' };

      if (await this.userService.get({ email: body.email }))
        return {
          status: 5001,
          message: 'Email already existed in another account.',
        };

      const id = this.generateSnowflake();

      await this.userService.create(
        {
          username: body.username,
          password: body.password,
          email: body.email,
          status: 'Hello! I just joined unchat!',
          avatar: `https://avatars.dicebear.com/api/avataaars/${body.username}.png`,
          id,
          createdAt: new Date(Date.now()).toISOString(),
        },
        authorization,
      );
      return {
        status: 200,
        message: 'OK',
        data: {
          username: body.username,
          email: body.email,
          status: 'Hello! I just joined unchat!',
          id,
        },
      };
    }
  }

  @Get(':id/channels')
  async getUserChannels(@Param('id') id: string, @Req() req: Request) {
    const { authorization } = req.headers;
    if (!(await this.checkAuthToken(authorization)))
      return { status: 401, message: 'Forbbiden' };

    const user = await this.userService.get({ id });
    if (!user) return { status: 404, message: 'User not found' };

    if (user) {
      const data = await this.userService._getChannels(id);
      return data ? data : [];
    }
  }

  @Get(':id/notifications')
  async getUserNotifications(@Param('id') id: string, @Req() req: Request) {
    const { authorization } = req.headers;
    if (!(await this.checkAuthToken(authorization)))
      return { status: 401, message: 'Forbbiden' };

    const user = await this.userService.get({ id });
    if (!user) return { status: 404, message: 'User not found' };

    if (user) {
      const data = await this.userService._getNotifications(user.id);
      return data;
    }
  }

  @Post(':id/notifications')
  async createUserNotifications(@Param('id') id: string, @Req() req: Request) {
    const { authorization } = req.headers;
    if (!(await this.checkAuthToken(authorization)))
      return { status: 401, message: 'Forbbiden' };

    const user = await this.userService.get({ id });
    if (!user) return { status: 404, message: 'User not found' };

    if (user) {
      if (!req.body.by || !req.body.type || !req.body.value)
        return {
          status: 400,
          message: 'Bad body request',
        };

      await this.userService._createNotification(
        id,
        req.body.by,
        req.body.type,
        req.body.value,
      );

      this.socket.emit(`NOTIFICATION_CREATE`, {
        by: req.body.by,
        type: req.body.type,
        value: await this.userService.get({ id: req.body.by }),
      });

      return { status: 200, message: 'OK' };
    }
  }

  @Post('mfa')
  async createMfaToken() {
    const data = await this.userService._createToken();
    return { status: 200, token: data };
  }

  @Delete('mfa/:token')
  async deleteMfaToken(@Param('token') token: string) {
    const data = await this.userService._getToken(token);
    if (!data) return { status: 404, message: 'Token not found' };
    await this.userService._deleteToken(token);
    return { status: 200, message: 'OK' };
  }
}
