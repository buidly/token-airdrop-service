import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AirdropService } from '@libs/services';
import { Injectable, Logger } from '@nestjs/common';
import { NotifierBlockEvent } from './entities/notifier.block.event';

@Injectable()
export class EventsNotifierConsumerService {
  private readonly logger: Logger;

  constructor(
    // private readonly configService: CommonConfigService,
    private readonly airdropService: AirdropService,
  ) {
    this.logger = new Logger(EventsNotifierConsumerService.name);
  }

  EGLD_DECIMALS: number = 18;
  @RabbitSubscribe({
    queue:
      'amqp://materiaprima-local:materiaprimalocal123@devnet-rabbitmq.beaconx.app:5672',
    createQueueIfNotExists: false,
  })
  async consumeEvents(blockEvent: NotifierBlockEvent) {
    try {
      const filteredEvents = blockEvent.events.filter((event) =>
        this.isFilteredAddress(event.address),
      );

      for (const event of filteredEvents) {
        const txHash = event.txHash;
        await this.airdropService.executeTransaction(txHash);
      }
    } catch (error) {
      this.logger.error(
        `An unhandled error occurred when consuming events from block ${blockEvent.hash}`,
        blockEvent.events,
      );
      this.logger.error(error);

      throw error;
    }
  }

  private isFilteredAddress(address: string) {
    return address === 'test';
  }
}
