import * as dotenv from 'dotenv';
import 'module-alias/register';
import { resolve } from 'path';

// Determine which .env file to load based on NODE_ENV
const envPath =
  process.env.NODE_ENV === 'infra'
    ? '.env'
    : `.env.${process.env.NODE_ENV ?? 'mainnet'}`;
dotenv.config({
  path: resolve(process.cwd(), envPath),
});

import { LoggerInitializer } from '@multiversx/sdk-nestjs-common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
import { PrivateAppModule } from './private.app.module';
// import { CronsModule } from './crons.module';

const logger = new Logger('Bootstrapper');

const setupPrivateApp = async () => {
  const privateApp = await NestFactory.create(PrivateAppModule);
  await privateApp.listen(4007);

  logger.log(`Private CRONS active on port ${4007}`);
};

async function bootstrap() {
  await NestFactory.create(PrivateAppModule);

  LoggerInitializer.initialize(logger);

  await setupPrivateApp();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
