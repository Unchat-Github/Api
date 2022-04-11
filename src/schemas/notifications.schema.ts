import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification extends Document {
  @Prop()
  author: string;

  @Prop()
  notifications: Notification[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
