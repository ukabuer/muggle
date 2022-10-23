export { default as Head } from "./Head.js";
export { default as Style } from "./Style";

import { createContext } from "preact";
import { useContext } from "preact/hooks";

const AppContext = createContext({
  path: "",
});

function useAppContext() {
  return useContext(AppContext);
}

export { AppContext, useAppContext };
