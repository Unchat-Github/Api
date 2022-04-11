import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelMessageReceive } from './interfaces/channel.interface';
import { simpleflake } from 'simpleflakes';
import { Request } from 'express';
import { io } from 'socket.io-client';
import { UsersService } from 'src/users/users.service';

@Controller('channels')
export class ChannelsController {
  constructor(private channelService: ChannelsService) {}

  private socket = io(`http://localhost:5000`);

  generateSnowflake() {
    return simpleflake(Date.now(), 23 - 200, Date.UTC(2000, 1, 1)).toString();
  }

  async checkAuthToken(token: string) {
    const data = await this.channelService._getToken(token);
    return data ? true : undefined;
  }

  @Get(':id')
  async getChannel(@Param() { id }: { id: string }) {
    const data = await this.channelService.get(id);
    if (!data) return { status: 404, message: 'Channel not found' };
    else return data;
  }

  @Patch(':id')
  async editChannel(
    @Param('id') id: string,
    @Body() { name, description }: { name: string; description: string },
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    if (!name && !description)
      return { status: 400, message: 'Bad body request' };
    const channel = await this.channelService.get(id);
    if (!channel) return { status: 404, message: 'Channel not found.' };

    if (channel) {
      const new_data = await this.channelService.edit(id, {
        name: name ? name : channel.name,
        description: description ? description : channel.description,
      });

      return { status: 200, message: 'OK', data: new_data };
    }
  }

  @Delete(':id')
  async deleteChannel(@Param('id') id: string, @Req() req: Request) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(id);
    if (!channel) return { status: 404, message: 'Channel not found' };

    if (channel) {
      const data = await this.channelService.delete(id);
      return { status: 200, message: 'OK' };
    }
  }

  @Post()
  async createChannel(
    @Body() body: { name: string; description: string; user: string },
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    if (!body || !body.name || !body.description)
      return { status: 400, message: 'Bad body request' };
    const data = await this.channelService.create({
      name: body.name,
      description: body.description,
      id: this.generateSnowflake(),
      createdAt: new Date(Date.now()).toISOString(),
      user: body.user,
    });
    return { status: 200, message: 'OK', data };
  }

  @Get(':channel_id/messages/:message_id')
  async getMessage(
    @Param()
    { channel_id, message_id }: { channel_id: string; message_id: string },
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(channel_id);
    if (!channel) return { status: 404, message: 'Channel not found' };
    const message = await this.channelService._getMessage(message_id);
    if (!message) return { status: 404, message: 'Message not found' };

    return message;
  }

  @Get(':channel_id/messages')
  async getChannelMessages(
    @Param('channel_id') channel_id: string,

    @Query('limit') limit: string,
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(channel_id);
    if (!channel) return { status: 404, message: 'Channel not found.' };

    if (channel) {
      const data = await this.channelService._getChannelMessages(
        channel_id,
        limit ? parseInt(limit) : 1000,
        parseInt(req.headers.slice as string),
      );
      return data ? data : [];
    }
  }

  @Patch(':channel_id/messages/:message_id')
  async editMessage(
    @Param()
    { channel_id, message_id }: { channel_id: string; message_id: string },
    @Body() body: { content: string },
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(channel_id);
    if (!channel) return { status: 404, message: 'Channel not found' };
    const message = await this.channelService._getMessage(message_id);
    if (!message) return { status: 404, message: 'Message not found' };

    if (message) {
      const new_data = await this.channelService._editMessage(
        message_id,
        body.content,
      );
      return { status: 200, message: 'OK', new_data };
    }
  }

  @Delete(':channel_id/messages/:message_id')
  async deleteMessage(
    @Param()
    { channel_id, message_id }: { channel_id: string; message_id: string },
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(channel_id);
    if (!channel) return { status: 404, message: 'Channel not found' };
    const message = await this.channelService._getMessage(message_id);
    if (!message) return { status: 404, message: 'Message not found' };

    if (message) {
      await this.channelService._deleteMessage(message_id);
      return { status: 200, message: 'OK' };
    }
  }

  @Post(':id/messages')
  async createMessage(
    @Param() id: { id: string },
    @Body() body: ChannelMessageReceive,
    @Req() req: Request,
  ) {
    if (!(await this.checkAuthToken(req.headers.authorization)))
      return { status: 401, message: 'Forbbidden' };

    const channel = await this.channelService.get(id.id);
    if (!channel) return { status: 404, message: 'Channel not found' };
    if (!body || !body.content || !body.author)
      return {
        status: 400,
        message: 'Bad body request',
      };

    const data = await this.channelService._createMessage({
      content: body.content,
      author: body.author,
      createdAt: new Date(Date.now()).toISOString(),
      id: this.generateSnowflake(),
      channel_id: id.id,
    });

    this.socket.emit(`MESSAGE_CREATE`, {
      content: body.content,
      author: await this.channelService.__getUser(body.author),
      createdAt: new Date(Date.now()).toISOString(),
      id: this.generateSnowflake(),
      channel_id: id.id,
    });

    return {
      status: 200,
      message: 'OK',
      data,
    };
  }
}
