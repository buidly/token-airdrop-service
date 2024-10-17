import {
  RabbitModule,
  RabbitModuleOptions,
} from '@multiversx/sdk-nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { EventsNotifierConsumerService } from './events.notifier.consumer.service';
import { EventsNotifierConfigModule } from './config/events-notifier-config.module';

@Module({
  imports: [
    RabbitModule.forRootAsync({
      useFactory: () =>
        new RabbitModuleOptions(
          'amqp://materiaprima-local:materiaprimalocal123@devnet-rabbitmq.beaconx.app:5672',
          [],
        ),
    }),
    EventsNotifierConfigModule,
  ],
  providers: [EventsNotifierConsumerService],
})
export class EventsNotifierModule {}
