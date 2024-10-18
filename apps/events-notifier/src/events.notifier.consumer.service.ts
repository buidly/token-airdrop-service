import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AirdropService } from '@libs/services';
import { Injectable, Logger } from '@nestjs/common';
import { NotifierBlockEvent } from './entities/notifier.block.event';
import { Address } from '@multiversx/sdk-core/out';

@Injectable()
export class EventsNotifierConsumerService {
  private readonly logger: Logger;

  constructor(private readonly airdropService: AirdropService) {
    this.logger = new Logger(EventsNotifierConsumerService.name);
  }

  EGLD_DECIMALS: number = 18;
  @RabbitSubscribe({
    queue: 'materiaprima-local',
    createQueueIfNotExists: false,
  })
  async consumeEvents(blockEvent: NotifierBlockEvent) {
    try {
      const filteredEvents = blockEvent.events.filter((event) =>
        this.isFilteredAddress(event.address),
      );

      for (const event of filteredEvents) {
        const identifier = event.identifier;
        if (identifier === 'ESDTTransfer') {
          const addressHex = Buffer.from(event.topics[3], 'base64').toString(
            'hex',
          );
          const tokenIdentifierHex = Buffer.from(
            event.topics[0],
            'base64',
          ).toString('hex');
          const tokenIdentifierString = Buffer.from(
            tokenIdentifierHex,
            'hex',
          ).toString('utf-8');
          console.log({ tokenIdentifierString });
          const address1 = Address.fromHex(addressHex);
          console.log(address1.toString()), console.log({ event });
          const txHash = event.txHash;
          await this.airdropService.executeTransaction(txHash);
        }
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
    return (
      address ===
      'erd1lu0s4s46rqwlwcpt6g8t4wlj9jnd39hxt7asjxyg2qmk2asv7q8quzuxpx'
    );
  }
}
