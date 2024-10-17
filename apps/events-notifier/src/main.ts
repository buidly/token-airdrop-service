import 'module-alias/register';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({
  path: resolve(process.cwd(), '.env'),
});

import { NestFactory } from '@nestjs/core';
import {
  CommonConfigModule,
  CommonConfigService,
  PubSubListenerModule,
} from '@libs/common';
import { Logger } from '@nestjs/common';
import { LoggerInitializer } from '@multiversx/sdk-nestjs-common';

import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrivateAppModule } from './private.app.module';
import { EventsNotifierModule } from './events.notifier.module';
import { EventsNotifierConfigService } from './config/events-notifier-config.service';
import { EventsNotifierConfigModule } from './config/events-notifier-config.module';

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

const setupPubSubApp = async (apiConfigService: CommonConfigService) => {
  const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    PubSubListenerModule,
    {
      transport: Transport.REDIS,
      options: {
        host: apiConfigService.config.redis.host,
        port: 6379,
        retryAttempts: 100,
        retryDelay: 1000,
        retryStrategy: () => 1000,
      },
    },
  );
  pubSubApp.useLogger(pubSubApp.get(WINSTON_MODULE_NEST_PROVIDER));
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pubSubApp.listen();
};

async function bootstrap() {
  const eventsNotifierConfigApp = await NestFactory.create(
    EventsNotifierConfigModule,
  );
  const apiConfigApp = await NestFactory.create(CommonConfigModule);
  const eventsNotifierConfigService =
    eventsNotifierConfigApp.get<EventsNotifierConfigService>(
      EventsNotifierConfigService,
    );
  const apiConfigService =
    apiConfigApp.get<CommonConfigService>(CommonConfigService);

  LoggerInitializer.initialize(logger);

  await setupEventsNotifierApp(eventsNotifierConfigService);
  await setupPrivateApp();
  await setupPubSubApp(apiConfigService);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
