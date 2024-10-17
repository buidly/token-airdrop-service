import { AirdropRepository } from '@libs/database';
import { Airdrop } from '@libs/entities';
import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import * as path from 'path';

@Injectable()
export class AirdropService {
  constructor(private readonly airdropRepository: AirdropRepository) {}

  async create(address: string, amount: string): Promise<Airdrop | null> {
    return await this.airdropRepository.create(address, amount);
  }

  async getHundredAirdropsToExecute(): Promise<Airdrop[]> {
    return await this.airdropRepository.getHundredAirdropsToExecute();
  }

  async addTransaction(
    address: string,
    txHash: string,
  ): Promise<Airdrop | null> {
    return await this.airdropRepository.addTransaction(address, txHash);
  }

  async executeTransaction(txHash: string): Promise<Airdrop | null> {
    return await this.airdropRepository.executeTransaction(txHash);
  }

  async cleanupOldTransactions(): Promise<void> {
    return await this.airdropRepository.cleanupOldTransactions();
  }

  async processAirdropCsv(): Promise<void> {
    const filePath = path.join(
      process.cwd(),
      'libs',
      'services',
      'src',
      'constants',
      'airdrop.csv',
    );

    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      }),
    );

    for await (const record of parser) {
      await this.create(record.address, record.amount);
    }
  }
}
