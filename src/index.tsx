export { default as Head } from "./Head";

import { createContext } from "preact";
import { useContext } from "preact/hooks";

const AppContext = createContext({
  path: "",
});

function useAppContext() {
  return useContext(AppContext);
}

export { AppContext, useAppContext };
