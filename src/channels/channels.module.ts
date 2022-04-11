import { ChannelsController } from './channels.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelSchema } from 'src/schemas/channel.schema';
import { ChannelsService } from './channels.service';
import { MessageSchema } from 'src/schemas/message.schema';
import { UserSchema } from 'src/schemas/users.schema';
import { TokensSchema } from 'src/schemas/tokens.schema';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'channels',
        schema: ChannelSchema,
      },
      {
        name: 'messages',
        schema: MessageSchema,
      },
      {
        name: 'users',
        schema: UserSchema,
      },
      {
        name: 'tokens',
        schema: TokensSchema,
      },
    ]),
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
})
export class ChannelModule {}
