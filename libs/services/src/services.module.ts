import { DynamicModuleUtils } from '@libs/common';
import { DatabaseModule } from '@libs/database';
import { Global, Module } from '@nestjs/common';
import { AirdropService } from './airdrop';

@Global()
@Module({
  imports: [DatabaseModule, DynamicModuleUtils.getCachingModule()],
  providers: [AirdropService],
  exports: [AirdropService],
})
export class ServicesModule {}
