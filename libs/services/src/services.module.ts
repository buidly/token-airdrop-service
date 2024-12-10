import { DatabaseModule } from '@libs/database';
import { Global, Module } from '@nestjs/common';
import { AirdropService } from './airdrop';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AirdropService],
  exports: [AirdropService],
})
export class ServicesModule {}
