import { ERDNEST_CONFIG_SERVICE } from '@multiversx/sdk-nestjs-common';
import { Provider } from '@nestjs/common';
import { SdkNestjsConfigServiceImpl } from '../config';

export class DynamicModuleUtils {
  static getNestJsApiConfigService(): Provider {
    return {
      provide: ERDNEST_CONFIG_SERVICE,
      useClass: SdkNestjsConfigServiceImpl,
    };
  }
}
