import { ComponentClass, ComponentType } from "preact";

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

export type Module<P = ComponentType> = {
  default?: P;
  preload?: () => Promise<unknown>;
};

export interface AsyncPageType extends ComponentClass<any> {
  LoadComponent(): Promise<void>;
  Load(params?: any): Promise<unknown>;
  Match(path: string): [boolean, any];
  route: string;
}
