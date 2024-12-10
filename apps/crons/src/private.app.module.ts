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
  imports: [LoggingModule, ApiMetricsModule, CommonConfigModule, CronsModule],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  controllers: [ApiMetricsController, HealthCheckController],
})
export class PrivateAppModule {}
