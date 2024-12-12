import { AirdropService } from '@libs/services';
import { Controller, Get, Post } from '@nestjs/common';

@Controller('airdrop')
export class AirdropController {
  constructor(private readonly airdropService: AirdropService) {}

  @Post('create')
  processCsv() {
    void this.airdropService.processAirdropCsv();
    return { message: 'Started processing CSV file' };
  }

  @Post('cleanup-airdrops')
  async cleanupOldTransactions() {
    await this.airdropService.cleanupOldTransactions();
    return {
      message: 'Airdrops with pending status older than 5 minutes deleted.',
    };
  }

  @Post('cleanup-invalid')
  async cleanupInvalidAddresses() {
    await this.airdropService.cleanupInvalidAddresses();
    return {
      message: 'Success',
    };
  }

  @Get('count-pending')
  async getPendingAirdropCount() {
    const pendingCount = await this.airdropService.countPendingAirdrops();
    const unprocessedCount =
      await this.airdropService.countUnprocessedAirdrops();
    return {
      message: 'Pending airdrop count retrieved successfully',
      pendingCount,
      unprocessedCount,
    };
  }
}
