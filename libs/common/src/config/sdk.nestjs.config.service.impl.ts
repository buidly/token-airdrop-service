import { ErdnestConfigService } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SdkNestjsConfigServiceImpl implements ErdnestConfigService {
  constructor() {}

  getSecurityAdmins(): string[] {
    return [];
  }

  getJwtSecret(): string {
    return ''; // We use only NativeAuth in this template, so we don't need a JWT secret
  }

  getApiUrl(): string {
    return '';
  }

  getNativeAuthMaxExpirySeconds(): number {
    return 0;
  }

  getNativeAuthAcceptedOrigins(): string[] {
    return [];
  }
}
