import { DynamicModuleUtils } from '@libs/common';
import { Module } from '@nestjs/common';
import { AirdropModule } from './airdrop/airdrop.module';

@Module({
  imports: [AirdropModule],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
})
export class EndpointsModule {}
