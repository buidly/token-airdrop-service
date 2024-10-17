import { Airdrop, AirdropDocument } from '@libs/entities';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AirdropRepository {
  constructor(
    @InjectModel(Airdrop.name)
    private readonly airdropModel: Model<AirdropDocument>,
  ) {}

  async create(address: string, amount: string): Promise<Airdrop | null> {
    const existingAirdrop = await this.airdropModel.findOne({ address }).exec();

    if (existingAirdrop) {
      return null;
    }

    const newAirdrop = new this.airdropModel({
      address,
      amount,
    });

    return await newAirdrop.save();
  }

  async findBatchWithoutTxHash(batchSize: number): Promise<Airdrop[]> {
    return await this.airdropModel
      .find({ txHash: { $exists: false } })
      .limit(batchSize)
      .exec();
  }

  async addTransaction(
    address: string,
    txHash: string,
  ): Promise<Airdrop | null> {
    return await this.airdropModel
      .findOneAndUpdate(
        { address },
        {
          txHash,
          timestamp: Date.now(),
          pending: true,
        },
        { new: true },
      )
      .exec();
  }

  async executeTransaction(txHash: string): Promise<Airdrop | null> {
    try {
      const airdrop = await this.airdropModel.findOne({ txHash }).exec();

      if (!airdrop || !airdrop.pending) {
        return null;
      }

      return await this.airdropModel
        .findOneAndUpdate(
          { txHash },
          {
            $unset: { timestamp: '' },
            pending: false,
            success: true,
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  async cleanupOldTransactions(): Promise<void> {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    await this.airdropModel
      .updateMany(
        {
          timestamp: { $lt: fiveMinutesAgo },
        },
        {
          $unset: { txHash: '', timestamp: '' },
          pending: false,
        },
      )
      .exec();
  }
}
