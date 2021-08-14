import { ComponentType, FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Route, Switch, useLocation, useRouter } from "wouter-preact";
import { useAppContext } from "./context";
import { AsyncPageType } from "./types";

function isError(data: unknown): data is { error: "string" } {
  return (
    data instanceof Object &&
    Object.prototype.hasOwnProperty.call(data, "error")
  );
}

type AppProps = {
  pages: Array<AsyncPageType>;
  initial?: unknown;
};

export type AppType = ComponentType<AppProps>;

const DefaultErrorPage: FunctionComponent = () => {
  return <div>Error</div>;
};

const pages: AppProps['pages'] = [];

const Router: FunctionComponent<{
  ErrorPage?: ComponentType;
  initial?: unknown
}> = ({ ErrorPage, initial = {} }) => {
  const { matcher } = useRouter();
  const [currentLocation] = useLocation();
  const [renderLocation, setRenderLocation] = useState(currentLocation);
  const [page, setPage] = useState(initial);
  const { setLoading } = useAppContext();

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
      .catch((err: any) => {
        setPage({ error: err.message });
      })
      .then(() => {
        setLoading(false);
        window.scrollTo(0, 0);
      });
  }, [currentLocation, matcher, setLoading]);

  const errorRoute = "/error";
  const location = isError(page) ? errorRoute : renderLocation;

  return (
    <Switch location={location}>
      {pages
        .map((page) => {
          return <Route path={page.route} component={page} />;
        })
        .concat([
          <Route
            component={(ErrorPage as FunctionComponent) || DefaultErrorPage}
          />,
        ])}
    </Switch>
  );
};

export default Router;
