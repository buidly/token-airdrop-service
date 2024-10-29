import { AirdropService } from '@libs/services';
import { Controller, Get, Post } from '@nestjs/common';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('create')
  processCsv() {
    void this.airdropService.processAirdropCsv();
    return { message: 'Airdrop CSV processed successfully' };
  }

  @Post('cleanup-airdrops')
  async cleanupOldTransactions() {
    await this.airdropService.cleanupOldTransactions();
    return {
      message: 'Airdrops with pending status older than 5 minutes deleted.',
    };
  }

  @Get('count-pending')
  async getPendingAirdropCount() {
    const pendingCount = await this.airdropService.countPendingAirdrops();
    return {
      message: 'Pending airdrop count retrieved successfully',
      pendingCount,
    };
  }
}
