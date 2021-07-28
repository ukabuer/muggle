import { createContext } from "preact";
import { useContext } from "preact/hooks";

const AppContext = createContext<{
  site: any;
  page: unknown;
  location: string;
  loading: boolean;
}>({ site: {}, page: {}, location: "", loading: false });

export default AppContext;

export const useAppContext = () => useContext(AppContext);
