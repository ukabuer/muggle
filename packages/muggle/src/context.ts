import { createContext } from "preact";
import { useContext } from "preact/hooks";

export type ServerRenderContextData = {
  path: string;
  exportMode: boolean;
  islandsProps: unknown[];
  reset: () => void;
};

const ServerRenderContext = createContext<ServerRenderContextData>({
  path: "",
  exportMode: false,
  islandsProps: [],
  reset: () => {},
});

function useServerRenderContext() {
  return useContext(ServerRenderContext);
}

export { ServerRenderContext, useServerRenderContext };
