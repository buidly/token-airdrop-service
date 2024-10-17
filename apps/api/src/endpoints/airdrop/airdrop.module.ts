import { ServicesModule } from '@libs/services/services.module';
import { Module } from '@nestjs/common';
import { AirdropController } from './airdrop.controller';

@Module({
  imports: [ServicesModule],
  controllers: [AirdropController],
})
export class AirdropModule {}
