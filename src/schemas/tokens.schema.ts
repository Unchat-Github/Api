import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema()
export class Token extends Document {
  @Prop()
  token: string;
}

export const TokensSchema = SchemaFactory.createForClass(Token);
