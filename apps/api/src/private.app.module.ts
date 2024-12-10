import { Module } from '@nestjs/common';
import { ApiMetricsController, HealthCheckController } from '@libs/common';
import { ApiMetricsModule, DynamicModuleUtils } from '@libs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { AppConfigModule } from './config/app-config.module';

@Module({
  imports: [
    LoggingModule,
    ApiMetricsModule,
    CommonConfigModule,
    AppConfigModule,
  ],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  controllers: [ApiMetricsController, HealthCheckController],
})
export class PrivateAppModule {}
