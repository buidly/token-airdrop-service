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

  async createMany(
    records: Array<{ address: string; amount: string }>,
  ): Promise<Airdrop[] | null> {
    try {
      const result = await this.airdropModel.insertMany(records, {
        ordered: false,
      });

      return result;
    } catch (error) {
      if (error instanceof Error && (error as any).code === 11000) {
        console.warn('Some records were skipped due to duplicate addresses.');
        return null;
      }

      console.error('Error processing batch:', error);
      throw error;
    }
  }

  async findBatchWithoutTxHash(batchSize: number): Promise<Airdrop[]> {
    return await this.airdropModel
      .find({ txHash: { $exists: false } })
      .limit(batchSize)
      .exec();
  }

  async countPendingAirdrops(): Promise<number> {
    return await this.airdropModel.countDocuments({ pending: true }).exec();
  }

  async addTransaction(
    address: string,
    txHash: string,
  ): Promise<Airdrop | null> {
    try {
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
    } catch (error) {
      console.error(`Failed to add transaction for address ${address}:`, error);
      return null;
    }
  }

  async addTransactions(
    updates: Array<{ address: string; txHash: string }>,
  ): Promise<void> {
    try {
      const updateOperations = updates.map(({ address, txHash }) => ({
        updateOne: {
          filter: { address },
          update: {
            $set: {
              txHash,
              timestamp: Date.now(),
              pending: true,
            },
          },
        },
      }));

      await this.airdropModel.bulkWrite(updateOperations, {
        ordered: false,
      });

      return;
    } catch (error) {
      console.error('Batch update failed:', error);
      return;
    }
  }

  async executeTransaction(txHash: string): Promise<Airdrop[] | null> {
    try {
      const airdrops = await this.airdropModel
        .find({ txHash, pending: true })
        .exec();

      if (!airdrops || airdrops.length === 0) {
        return null;
      }

      await this.airdropModel
        .updateMany(
          { txHash, pending: true },
          {
            $unset: { timestamp: '' },
            pending: false,
            success: true,
          },
        )
        .exec();

      return this.airdropModel.find({ txHash }).exec();
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
