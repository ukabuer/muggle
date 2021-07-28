import { Component, ComponentType } from "preact";
import makeMatcher from "../node_modules/wouter-preact/matcher";
import { AsyncPageType, Module } from "./types";
import AppContext from "./context";

export function createAsyncPage<Props>(
  file: string,
  loader: () => Promise<Module<ComponentType<Props>>>,
  fetch: typeof window.fetch
) {
  let route = file
    .replace(".tsx", "")
    .replace(/\/index$/, "/")
    .replace("../../../site/routes", "");
  const matches = route.match(/\[(\w+)\]/g);
  if (matches && matches.length > 0) {
    for (const match of matches) {
      const slug = match.substring(1, match.length - 1);
      route = route.replace(match, `:${slug}`);
    }
  }
  let LoadedComponent: ComponentType<Props> | null = null;
  let GetPageDataFn:
    | ((fetch: typeof window.fetch, params?: any) => Promise<unknown>)
    | null = null;

  const AsyncPage: AsyncPageType = class extends Component<Props> {
    static async LoadComponent() {
      const m = await loader();
      LoadedComponent = m.default || null;
      GetPageDataFn = m.preload || null;
    }

    static async Load(params?: any) {
      if (LoadedComponent == null) {
        await AsyncPage.LoadComponent();
      }

      if (GetPageDataFn != null) {
        return GetPageDataFn(fetch, params);
      }

      return {};
    }

    static route: string = route;

    static Match(url: string) {
      return makeMatcher()(route, url);
    }

    state = {
      Page: LoadedComponent,
    };

    render() {
      const { Page } = this.state;
      if (Page == null) {
        return null;
      }
      return (
        <AppContext.Consumer>
          {(value) => <Page {...this.props} page={value.page} />}
        </AppContext.Consumer>
      );
    }
  };

  return AsyncPage;
}
