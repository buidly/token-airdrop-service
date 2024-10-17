import { Global, Module } from '@nestjs/common';
import { EventsNotifierConfigService } from './events-notifier-config.service';

@Global()
@Module({
  providers: [EventsNotifierConfigService],
  exports: [EventsNotifierConfigService],
})
export class EventsNotifierConfigModule {}
