/* eslint-disable no-restricted-syntax */
/* eslint-disable react/require-default-props */
import { ComponentType, FunctionComponent } from "preact";
import {
  Route, Switch, useLocation, useRouter,
} from "wouter-preact";
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

const DefaultErrorPage: FunctionComponent = () => (
  <div>
    <Head>
      <title>Error</title>
    </Head>
    Error
  </div>
);

const App: FunctionComponent<AppProps> = ({ pages, initial = {} } : AppProps) => {
  const { matcher } = useRouter();
  const [currentLocation] = useLocation();
  const [renderLocation, setRenderLocation] = useState(currentLocation);
  const [page, setPage] = useState(initial);
  const [loading, setLoading] = useState(false);
  const ErrorPage = useMemo(() => pages.find((p) => p.route === ErrorPath) || null, [pages]);

  useEffect(() => {
    let matchedParams: unknown | null = null;
    let macthedPage: AsyncPageType | null = ErrorPage;
    for (const p of pages) {
      const match = matcher(p.route, currentLocation);
      const matched = match[0];
      if (matched) {
        [matchedParams] = match;
        macthedPage = p;
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
        setRenderLocation((prevRenderLocation) => {
          if (prevRenderLocation !== currentLocation) {
            window.scrollTo(0, 0);
          }
          return isErrorPage ? ErrorPath : currentLocation;
        });
      })
      .catch((err: unknown) => {
        setPage({ error: (err && (err as Error).message) || "unknwon" });
      })
      .then(() => {
        setLoading(false);
      });
  }, [currentLocation, matcher, pages, ErrorPage]);

  const location = renderLocation;

  const contextValue = useMemo(() => ({
    site: {},
    page,
    location,
    loading,
    setLoading,
  }), [loading, location, page]);

  return (
    <AppContext.Provider
      value={contextValue}
    >
      <Switch location={location}>
        {pages
          .map((p) => <Route key={p.route} path={p.route} component={p as any} />)
          .concat([<Route key="/error" component={(ErrorPage || DefaultErrorPage) as any} />])}
      </Switch>
    </AppContext.Provider>
  );
};

export default App;
