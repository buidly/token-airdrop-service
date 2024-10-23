import { AirdropService } from '@libs/services';
import { Controller, Post } from '@nestjs/common';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('create')
  processCsv() {
    void this.airdropService.processAirdropCsv();
    return { message: 'Airdrop CSV processed successfully' };
  }
}
