import { Component, createContext, VNode } from "preact";
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
  reset: () => void;
};

const ServerRenderContext = createContext<ServerRenderContextData>({
  path: "",
  exportMode: false,
  islandsProps: [],
  heads: {
    title: null,
    base: null,
    meta: {
      charSet: null,
      others: {},
    },
    others: [],
  },
  reset: () => {},
});

function useServerRenderContext() {
  return useContext(ServerRenderContext);
}

export { ServerRenderContext, useServerRenderContext };
