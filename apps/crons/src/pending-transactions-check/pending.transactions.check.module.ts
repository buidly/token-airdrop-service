import { Module } from '@nestjs/common';
import { PendingTransactionsCheckService } from './pending.transactions.check.service';
import { CommonConfigModule } from '@libs/common';
// eslint-disable-next-line no-restricted-imports
import { AirdropModule } from 'apps/api/src/endpoints/airdrop/airdrop.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [CommonConfigModule, AirdropModule, ScheduleModule.forRoot()],
  providers: [PendingTransactionsCheckService],
})
export class PendingTransactionsCheckModule {}
