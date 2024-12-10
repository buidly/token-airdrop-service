import {
  ApiMetricsController,
  ApiMetricsModule,
  DynamicModuleUtils,
  HealthCheckController,
} from '@libs/common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { Module } from '@nestjs/common';
import { EventsNotifierConfigModule } from './config/events-notifier-config.module';

@Module({
  imports: [
    LoggingModule,
    ApiMetricsModule,
    CommonConfigModule,
    EventsNotifierConfigModule,
  ],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  controllers: [ApiMetricsController, HealthCheckController],
})
export class PrivateAppModule {}
