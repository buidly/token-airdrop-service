import {
  RabbitModule,
  RabbitModuleOptions,
} from '@multiversx/sdk-nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { EventsNotifierConsumerService } from './events.notifier.consumer.service';
import { EventsNotifierConfigModule } from './config/events-notifier-config.module';
// eslint-disable-next-line no-restricted-imports
import { AirdropModule } from 'apps/api/src/endpoints/airdrop/airdrop.module';
import { CommonConfigModule, CommonConfigService } from '@libs/common';

@Module({
  imports: [
    CommonConfigModule,
    RabbitModule.forRootAsync({
      inject: [CommonConfigService],
      useFactory: (commonConfigService: CommonConfigService) =>
        new RabbitModuleOptions(commonConfigService.config.urls.queue, []),
    }),
    EventsNotifierConfigModule,
    AirdropModule,
  ],
  providers: [EventsNotifierConsumerService],
})
export class EventsNotifierModule {}
