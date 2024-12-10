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
import { EventsNotifierConfigService } from './config/events-notifier-config.service';
import { EventsNotifierModule } from './events.notifier.module';
import { PrivateAppModule } from './private.app.module';

const logger = new Logger('Bootstrapper');

const setupEventsNotifierApp = async (
  configService: EventsNotifierConfigService,
) => {
  const eventsNotifierApp = await NestFactory.create(EventsNotifierModule);
  const port = configService.config.port;
  await eventsNotifierApp.listen(port);

  logger.log(`Events notifier active on port ${port}`);
};

const setupPrivateApp = async () => {
  const privateApp = await NestFactory.create(PrivateAppModule);
  await privateApp.listen(4006);

  logger.log(`Private API active on port ${4006}`);
};

async function bootstrap() {
  const app = await NestFactory.create(PrivateAppModule);
  const eventsNotifierConfigService = app.get<EventsNotifierConfigService>(
    EventsNotifierConfigService,
  );

  LoggerInitializer.initialize(logger);

  await setupEventsNotifierApp(eventsNotifierConfigService);
  await setupPrivateApp();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
