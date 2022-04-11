import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelSchema } from 'src/schemas/channel.schema';
import { TokensSchema } from 'src/schemas/tokens.schema';
import { UserSchema } from 'src/schemas/users.schema';
import { NotificationSchema } from 'src/schemas/notifications.schema';
import { UserController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'users',
        schema: UserSchema,
      },
      {
        name: 'tokens',
        schema: TokensSchema,
      },
      {
        name: 'channels',
        schema: ChannelSchema,
      },
      {
        name: 'notifications',
        schema: NotificationSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UsersService],
})
export class UsersModule {}
