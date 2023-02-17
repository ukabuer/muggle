import { createContext, VNode } from "preact";
import { useContext } from "preact/hooks";

export type ServerRenderContextData = {
  path: string;
  exportMode: boolean;
  islandsProps: unknown[];
  heads: {
    title: VNode | null;
    base: VNode | null;
    meta: {
      charSet: VNode | null;
      others: Record<string, VNode>;
    };
    others: VNode[];
  };
  styles: Map<string, string>;
  stylesOrder: string[];
  reset: () => void;
  addStyle: (id: string, style: string) => void;
};

const ServerRenderContext = createContext<ServerRenderContextData | undefined>(
  undefined,
);

function useServerRenderContext() {
  const context = useContext(ServerRenderContext);
  if (!context) {
    throw new Error("useServerRenderContext must be used within a Provider");
  }
  return context;
}

export { ServerRenderContext, useServerRenderContext };
