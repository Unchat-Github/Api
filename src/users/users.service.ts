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
    private readonly notifModel: Model<NotificationDocument>,
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

  async _getNotifications(id: string) {
    const [data] = await this.notifModel.aggregate([
      { $match: { author: id } },
      {
        $lookup: {
          from: 'users',
          localField: 'notifications.author',
          foreignField: 'id',
          as: 'users',
          pipeline: [{ $project: { _id: 0, __v: 0, password: 0, email: 0 } }],
        },
      },
      {
        $project: {
          notifications: {
            $map: {
              input: '$notifications',
              as: 'c',
              in: {
                $mergeObjects: [
                  '$$c',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$users',
                          cond: {
                            $eq: ['$$c.notifications.author', '$$this._id'],
                          },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          notifications: {
            $map: {
              input: '$notifications',
              as: 'n',
              in: {
                author: {
                  avatar: '$$n.avatar',
                  id: '$$n.id',
                  createdAt: '$$n.createdAt',
                  status: '$$n.status',
                  username: '$$n.username',
                },
                type: '$$n.type',
                value: '$$n.value',
              },
            },
          },
          author: id,
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);

    return data;
  }

  /**
   * Notifications
   */
  async _createNotification(
    id: string,
    by: string,
    type: 'invite' | 'friend',
    value: string,
  ) {
    const user = await this.notifModel.findOne({ author: id });
    let data: any;
    if (!user) {
      data = await this.notifModel.create({
        author: id,
        notifications: [
          {
            author: by,
            type,
            value,
          },
        ],
      });
    } else {
      data = await this.notifModel.updateOne(
        { author: id },
        {
          $push: {
            notifications: {
              author: by,
              type,
              value,
            },
          },
        },
      );
    }
    return data;
  }
}
