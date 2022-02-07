import { createContext } from "preact";
import { useContext } from "preact/hooks";

interface ContextType {
  site: unknown;
  page: unknown;
  location: string;
  loading: boolean;
  // eslint-disable-next-line no-unused-vars
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<ContextType>({
  site: {}, page: {}, location: "", loading: false, setLoading: () => 0,
});

export default AppContext;

export const AppContextProvider = AppContext.Provider;

export const useAppContext = () => useContext(AppContext);
