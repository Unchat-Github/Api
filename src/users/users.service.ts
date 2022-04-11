import { TokenDocument } from './../schemas/tokens.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from 'src/schemas/users.schema';
import { Model } from 'mongoose';
import { DbUser } from './interfaces/user.interface';
import { generate } from 'rand-token';
import { ChannelDocument } from 'src/schemas/channel.schema';
import { NotificationDocument } from 'src/schemas/notifications.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('users') private readonly userModel: Model<UserDocument>,
    @InjectModel('tokens') private readonly tokensModel: Model<TokenDocument>,
    @InjectModel('channels')
    private readonly channelModel: Model<ChannelDocument>,
    @InjectModel('notifications')
    private readonly notificatioModel: Model<NotificationDocument>,
  ) {}

  async get(query: {
    username?: string;
    email?: string;
    id?: string;
    password?: string;
  }) {
    const data = await this.userModel.findOne(query, {
      _id: 0,
      __v: 0,
      password: 0,
      email: 0,
    });

    return data;
  }

  async edit(
    id: string,
    body: { username: string; status: string; avatar: string },
  ) {
    const data = await this.userModel.updateOne({ id }, body);
    return data;
  }

  async create(body: DbUser, token: string) {
    await this.userModel.create({
      username: body.username,
      password: body.password,
      email: body.email,
      avatar: body.avatar,
      id: body.id,
      createdAt: body.createdAt,
      status: body.status,
    });
    await this._deleteToken(token);
    return { status: 200, message: 'OK' };
  }

  async _getChannels(id: string) {
    const data = await this.channelModel.aggregate([
      {
        $match: {
          members: id,
        },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
        },
      },
    ]);

    return data;
  }

  async _getToken(token: string) {
    const data = await this.tokensModel.findOne({ token }, { _id: 0, __v: 0 });
    if (!data) return false;
    else return true;
  }

  async _deleteToken(token: string) {
    await this.tokensModel.deleteOne({ token });
    return true;
  }

  async _createToken() {
    const new_token = generate(32);
    const data = new this.tokensModel({ token: new_token });
    await data.save();
    return new_token;
  }

  /**
   * Notifications
   */
  async getNotifications(id: string) {
    const data = await this.notificatioModel.aggregate([
      {
        $match: { author: id },
      },
      {
        $project: { _id: 0, __v: 0 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'notifications.author',
          foreignField: 'id',
          as: 'notifications.author',
          pipeline: [
            {
              $project: { _id: 0, email: 0, password: 0 },
            },
          ],
        },
      },
    ]);

    return data;
  }
}
