import { AirdropService } from '@libs/services';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PendingTransactionsCheckService {
  constructor(private readonly airdropService: AirdropService) {}

  @Cron('*/30 * * * * *')
  async checkPendingTransactions(): Promise<void> {
    console.log(new Date().toLocaleString());
    await this.airdropService.cleanupOldTransactions();
  }
}
