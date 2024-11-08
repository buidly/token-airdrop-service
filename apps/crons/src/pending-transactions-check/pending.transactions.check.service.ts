import { AirdropService } from '@libs/services';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PendingTransactionsCheckService {
  constructor(private readonly airdropService: AirdropService) {}

  //disabled
  // @Cron('*/30 * * * * *')
  // async checkPendingTransactions(): Promise<void> {
  //   await this.airdropService.cleanupOldTransactions();
  // }

  @Cron('*/2 * * * *')
  async sendAirdrops(): Promise<void> {
    await this.airdropService.processAirdrops();
  }
}
