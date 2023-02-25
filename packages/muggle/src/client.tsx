import { createContext } from "preact";
import { useContext } from "preact/hooks";

export type AppContextData = {
  path: string;
  loading: boolean;
};

// rome-ignore lint/suspicious/noExplicitAny:generic handler type
type Hanlder = ((v: any) => void) | (() => void);
class EventManager {
  all: Record<string, Array<Hanlder>>;

  constructor() {
    this.all = {};
  }

  on(event: string, handler: Hanlder) {
    if (this.all[event]) {
      this.all[event].push(handler);
    } else {
      this.all[event] = [handler];
    }
  }

  off(event: string, handler: Hanlder) {
    const handlers = this.all[event] || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, v?: unknown) {
    const handlers = this.all[event] || [];
    for (const handler of handlers) handler(v);
  }
}

export const EventsManager = new EventManager();

const AppContext = createContext<AppContextData | undefined>(undefined);

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a Provider");
  }
  return context;
}

export { AppContext, useAppContext };
