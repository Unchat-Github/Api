import { ChannelMember } from './../channels/interfaces/channel.interface';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChannelDocument = Channel & Document;

@Schema()
export class Channel extends Document {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  createdAt: string;

  @Prop()
  id: string;

  @Prop()
  members: string[];
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
