/* eslint-disable no-unused-vars */
import { ComponentClass, ComponentType } from "preact";

export type Module<P = ComponentType> = {
  default?: P;
  preload?: () => Promise<unknown>;
};

declare global {
  interface ImportMeta {
    env: {
      SSR: boolean;
    };
    globEager: (s: string) => Record<string, Module>;
    glob: (s: string) => Record<string, () => Promise<Module>>;
  }

  interface Window {
    __PRELOAD_DATA__?: unknown;
  }
}

export interface AsyncPageType<P = unknown> extends ComponentClass<P> {
  LoadComponent(): Promise<void>;
  Load(params?: unknown): Promise<unknown>;
  Match(path: string): [boolean, unknown];
  route: string;
}
