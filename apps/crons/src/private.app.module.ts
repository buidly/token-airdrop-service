import {
  ApiMetricsController,
  ApiMetricsModule,
  DynamicModuleUtils,
  HealthCheckController,
} from '@libs/common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { Module } from '@nestjs/common';
import { CronsModule } from './crons.module';

@Module({
  imports: [
    LoggingModule,
    ApiMetricsModule,
    DynamicModuleUtils.getCachingModule(),
    CommonConfigModule,
    CronsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [ApiMetricsController, HealthCheckController],
})
export class PrivateAppModule {}
