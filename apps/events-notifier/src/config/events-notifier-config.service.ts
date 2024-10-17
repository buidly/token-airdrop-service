import { configuration } from '@libs/common/config/configuration';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsNotifierConfigService {
  readonly config = configuration().apps.eventsNotifier;
}
