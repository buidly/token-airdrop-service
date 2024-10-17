import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AirdropDocument = Airdrop & Document;

@Schema()
export class Airdrop {
  @Prop({ required: true })
  address: string = '';

  @Prop({ required: true })
  amount: string = '';

  @Prop()
  txHash?: string;

  @Prop()
  timestamp?: number;

  @Prop()
  pending?: boolean;

  @Prop()
  success?: boolean;
}

export const AirdropSchema = SchemaFactory.createForClass(Airdrop);
