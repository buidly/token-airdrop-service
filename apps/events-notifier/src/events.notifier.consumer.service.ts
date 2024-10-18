import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { CommonConfigService } from '@libs/common';
import { AirdropService } from '@libs/services';
import { Mnemonic, UserSigner } from '@multiversx/sdk-wallet/out';
import { Injectable, Logger } from '@nestjs/common';
import { ESDT_TRANSFER_IDENTIFIER } from './entities/events.utils';
import { NotifierBlockEvent } from './entities/notifier.block.event';

@Injectable()
export class EventsNotifierConsumerService {
  private readonly logger: Logger;

  constructor(
    private readonly airdropService: AirdropService,
    private readonly commonConfigService: CommonConfigService,
  ) {
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
        if (identifier === ESDT_TRANSFER_IDENTIFIER) {
          // const addressHex = Buffer.from(event.topics[3], 'base64').toString(
          //   'hex',
          // );
          // const tokenIdentifierHex = Buffer.from(
          //   event.topics[0],
          //   'base64',
          // ).toString('hex');
          // const tokenIdentifierString = Buffer.from(
          //   tokenIdentifierHex,
          //   'hex',
          // ).toString('utf-8');
          // const address1 = Address.fromHex(addressHex);
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
    const mnemonic = Mnemonic.fromString(
      this.commonConfigService.config.mnemonics.first,
    ).deriveKey(0);
    const signer = new UserSigner(mnemonic);
    const senderAddress = signer.getAddress().bech32();
    return address === senderAddress;
  }
}
