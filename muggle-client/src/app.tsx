import { ComponentType, FunctionComponent } from "preact";
import { Route, Switch, useLocation, useRouter } from "wouter-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import Head from "./Head.js";
import { AsyncPageType } from "./types.js";
import AppContext from "./context.js";

type AppProps = {
  pages: Array<AsyncPageType>;
  initial?: unknown;
};

export const ErrorPath = "/error";

export type AppType = ComponentType<AppProps>;

const DefaultErrorPage: FunctionComponent = () => {
  return <div><Head><title>Error</title></Head>Error</div>;
};

const App: FunctionComponent<AppProps> = ({ pages, initial = {} }) => {
  const { matcher } = useRouter();
  const [currentLocation] = useLocation();
  const [renderLocation, setRenderLocation] = useState(currentLocation);
  const [page, setPage] = useState(initial);
  const [loading, setLoading] = useState(false);
  const ErrorPage = useMemo(() => {
    return pages.find((page) => page.route == ErrorPath) || null;
  }, [pages]);

  useEffect(() => {
    let matchedParams: unknown | null = null;
    let macthedPage: AsyncPageType | null = ErrorPage;
    for (const page of pages) {
      const match = matcher(page.route, currentLocation);
      const matched = match[0];
      if (matched) {
        matchedParams = match[1];
        macthedPage = page;
        break;
      }
    }

    if (!macthedPage) {
      setRenderLocation(ErrorPath);
      return;
    }

    setLoading(true);
    macthedPage
      .Load(matchedParams)
      .then((data: unknown) => {
        const isErrorPage = macthedPage === ErrorPage;
        setPage(isErrorPage ? { error: "Not Found" } : data);
        setRenderLocation(isErrorPage ? ErrorPath : currentLocation);
      })
      .catch((err: unknown) => {
        setPage({ error: (err && (err as Error).message) || 'unknwon' });
      })
      .then(() => {
        setLoading(false);
        window.scrollTo(0, 0);
      });
  }, [currentLocation, matcher, pages, ErrorPage]);

  const location = renderLocation;
  return (
    <AppContext.Provider
      value={{
        site: {},
        page,
        location,
        loading,
        setLoading: setLoading,
      }}
    >
      <Switch location={location}>
        {pages
          .map((page) => {
            return <Route path={page.route} component={page} />;
          })
          .concat([<Route component={DefaultErrorPage} />])}
      </Switch>
    </AppContext.Provider>
  );
};

export default App;
