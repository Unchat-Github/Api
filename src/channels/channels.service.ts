import { ChannelDocument } from '../schemas/channel.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, ChannelMessage } from './interfaces/channel.interface';
import { MessageDocument } from 'src/schemas/message.schema';
import { TokenDocument } from 'src/schemas/tokens.schema';
import { UserDocument } from 'src/schemas/users.schema';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel('channels')
    private readonly channelModel: Model<ChannelDocument>,
    @InjectModel('messages')
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel('tokens')
    private readonly tokensModel: Model<TokenDocument>,
    @InjectModel('users') private readonly userModel: Model<UserDocument>,
  ) {}

  async get(id: string) {
    const data = await this.channelModel.aggregate([
      {
        $match: { id },
      },
      {
        $project: {
          _id: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: 'id',
          as: 'members',
          pipeline: [
            {
              $project: { _id: 0, __v: 0, password: 0, email: 0 },
            },
          ],
        },
      },
    ]);

    return data[0];
  }

  async __getUser(id: string) {
    const data = await this.userModel.findOne(
      { id },
      {
        _id: 0,
        __v: 0,
        password: 0,
        email: 0,
      },
    );

    return data;
  }

  async findAll() {
    return await this.channelModel.find({}, { _id: 0, __v: 0 });
  }

  async create(body: Channel & { user: string }) {
    const data = new this.channelModel({
      name: body.name,
      description: body.description,
      createdAt: body.createdAt,
      members: [body.user],
      id: body.id,
    });
    await data.save();
    return data;
  }

  async delete(id: string) {
    const data = await this.channelModel.deleteOne({ id });
    return data;
  }

  async edit(id: string, body: { name: string; description: string }) {
    const data = await this.channelModel.updateOne(
      { id },
      { $set: { name: body.name, description: body.description } },
    );

    return data;
  }

  async _getMessage(id: string) {
    const data = await this.messageModel.aggregate([
      { $match: { id } },
      {
        $project: {
          _id: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: 'id',
          as: 'author',
          pipeline: [{ $project: { _id: 0, __v: 0, password: 0, email: 0 } }],
        },
      },
      {
        $unwind: '$author',
      },
    ]);

    return data[0];
  }

  async _editMessage(id: string, content: string) {
    const data = await this.messageModel.updateOne(
      { id },
      { $set: { content } },
    );
    return data;
  }
  async _getChannelMessages(
    channel_id: string,
    limit?: number,
    slice?: number,
  ) {
    const data = await this.messageModel.aggregate([
      {
        $match: { channel_id },
      },
      slice
        ? {
            $skip: slice,
          }
        : { $skip: 0 },
      {
        $limit: limit ? limit : 1000,
      },
      {
        $project: {
          _id: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: 'id',
          as: 'author',
          pipeline: [{ $project: { _id: 0, __v: 0, password: 0, email: 0 } }],
        },
      },
      {
        $unwind: '$author',
      },
    ]);

    return data;
  }

  async _deleteMessage(id: string) {
    await this.messageModel.deleteOne({ id });
    return { status: 200, message: 'OK' };
  }

  async _createMessage(body: ChannelMessage) {
    const data = await this.messageModel.create(body);
    return data;
  }

  async _getToken(token: string) {
    const data = await this.tokensModel.findOne({ token }, { _id: 0, __v: 0 });
    if (!data) return false;
    else return true;
  }
}
