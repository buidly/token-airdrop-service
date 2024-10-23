import { AirdropService } from '@libs/services';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PendingTransactionsCheckService {
  constructor(private readonly airdropService: AirdropService) {}

  @Cron('*/30 * * * * *')
  async checkPendingTransactions(): Promise<void> {
    console.log('CRON CHECK PENDING TX');
    await this.airdropService.cleanupOldTransactions();
  }

  @Cron('0 * * * * *')
  async sendAirdrops(): Promise<void> {
    console.log('CRON PROCESS TX');
    await this.airdropService.processAirdrops();
  }
}
