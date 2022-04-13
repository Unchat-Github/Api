import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from 'src/users/interfaces/notification.interface';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification extends Document {
  @Prop()
  author: string;

  @Prop()
  notifications: NotificationType[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
