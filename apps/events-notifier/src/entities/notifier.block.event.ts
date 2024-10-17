import { NotifierEvent } from './notifier.event';

export class NotifierBlockEvent {
  hash: string = '';
  events: NotifierEvent[] = [];
}
