import { AirdropService } from '@libs/services';
import { Controller, Post } from '@nestjs/common';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('create')
  async processCsv() {
    await this.airdropService.processAirdropCsv();
    return { message: 'Airdrop CSV processed successfully' };
  }

  @Post('send-airdrop')
  async processTransactions() {
    await this.airdropService.processAirdrops();
    return { message: 'Airdrop transactions processed successfully' };
  }
}
