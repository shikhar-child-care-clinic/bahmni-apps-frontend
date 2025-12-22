type ConsultationEvent = 'consultation:saved';
type EventCallback = (data?: unknown) => void;

class EventBus {
  private listeners = new Map<ConsultationEvent, Set<EventCallback>>();

  subscribe(event: ConsultationEvent, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    console.log(
      `[EventBus] Subscribed to '${event}'. Total subscribers:`,
      this.listeners.get(event)!.size,
    );
  }

  publish(event: ConsultationEvent, data?: unknown): void {
    const subscribers = this.listeners.get(event);
    console.log(
      `[EventBus] Publishing '${event}' to ${subscribers?.size ?? 0} subscribers`,
    );
    subscribers?.forEach((cb) => cb(data));
  }

  unsubscribe(event: ConsultationEvent, callback: EventCallback): void {
    const wasDeleted = this.listeners.get(event)?.delete(callback);
    console.log(
      `[EventBus] Unsubscribe from '${event}'. Success: ${wasDeleted}. Remaining:`,
      this.listeners.get(event)?.size ?? 0,
    );
  }
}

export const eventBus = new EventBus();
