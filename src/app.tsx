import { ComponentType, FunctionComponent } from "preact";
import { Route, Switch, useLocation, useRouter } from "wouter-preact";
import { useEffect, useState } from "preact/hooks";
import { AsyncPageType } from "./types";
import AppContext from "./context";

function isError(data: unknown): data is { error: "string" } {
  return (
    data instanceof Object &&
    Object.prototype.hasOwnProperty.call(data, "error")
  );
}

type CreateAppProps = {
  Layout: ComponentType;
  ErrorPage?: ComponentType;
  site?: unknown;
};

type AppProps = {
  pages: Array<AsyncPageType>;
  initial?: unknown;
};

const DefaultErrorPage: FunctionComponent = () => {
  return <div>Error</div>;
};

function createApp({
  Layout,
  ErrorPage,
  site,
}: CreateAppProps): FunctionComponent<AppProps> {
  return ({ pages, initial = {} }) => {
    const { matcher } = useRouter();
    const [currentLocation] = useLocation();
    const [renderLocation, setRenderLocation] = useState(currentLocation);
    const [page, setPage] = useState(initial);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      let matchedParams: unknown | null = null;
      let macthedPage: AsyncPageType | null = null;
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
        return;
      }

      setLoading(true);
      macthedPage
        .Load(matchedParams)
        .then((data) => {
          setPage(data);
          setRenderLocation(currentLocation);
        })
        .catch((err) => {
          setPage({ error: err.message });
        })
        .then(() => {
          setLoading(false);
          window.scrollTo(0, 0);
        });
    }, [currentLocation, matcher, pages]);

    const errorRoute = "/error";
    const location = isError(page) ? errorRoute : renderLocation;
    return (
      <AppContext.Provider
        value={{
          site,
          page,
          location,
          loading,
        }}
      >
        <Layout>
          <Switch location={location}>
            {pages
              .map((page) => {
                return <Route path={page.route} component={page} />;
              })
              .concat([
                <Route
                  component={
                    (ErrorPage as FunctionComponent) || DefaultErrorPage
                  }
                />,
              ])}
          </Switch>
        </Layout>
      </AppContext.Provider>
    );
  };
}

export default createApp;
