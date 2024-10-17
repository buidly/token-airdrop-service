import { Module } from '@nestjs/common';
// eslint-disable-next-line no-restricted-imports
import { AirdropModule } from 'apps/api/src/endpoints/airdrop/airdrop.module';
import { PendingTransactionsCheckModule } from './pending-transactions-check/pending.transactions.check.module';

@Module({
  imports: [PendingTransactionsCheckModule, AirdropModule],
  providers: [],
})
export class CronsModule {}
