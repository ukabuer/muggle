import { createContext } from "preact";
import { useContext } from "preact/hooks";

const AppContext = createContext<{
  site: any;
  page: unknown;
  location: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}>({ site: {}, page: {}, location: "", loading: false, setLoading: () => 0 });

export default AppContext;

export const AppContextProvider = AppContext.Provider;

export const useAppContext = () => useContext(AppContext);
