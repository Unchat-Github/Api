import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

interface MessageAttachments {
  url: string;
  name: string;
}

@Schema()
export class Message {
  @Prop()
  content: string;

  @Prop()
  attachments: MessageAttachments[];

  @Prop()
  createdAt: string;

  @Prop()
  id: string;

  @Prop()
  author: string;

  @Prop()
  channel_id: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
