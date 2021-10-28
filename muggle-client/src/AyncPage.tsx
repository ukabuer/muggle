import { Component, ComponentType } from "preact";
import makeMatcher from "wouter-preact/matcher";
import { AsyncPageType, Module } from "./types.js";
import AppContext from "./context.js";
import unfetch from "isomorphic-unfetch";

export function createAsyncPage<Props>(
  route: string,
  loader: () => Promise<Module<ComponentType<Props>>>,
  fetch: typeof unfetch
) {
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
      try {
        const m = await loader();
        LoadedComponent = m.default || null;
        GetPageDataFn = m.preload || null;
      } catch(e: unknown) {
        console.error(`route \`${route}\` LoadComponent error: ${(e as Error).toString()}`);
      }
    }

    static async Load(params?: any) {
      if (LoadedComponent == null) {
        console.log(`route \`${route}\` LoadComponent`);
        await AsyncPage.LoadComponent();
        console.log(`route \`${route}\` LoadedComponent ${LoadedComponent !== null}`);
      }

      if (GetPageDataFn != null) {
        console.log(`route \`${route}\` GetPageDataFn`);
        return GetPageDataFn(fetch, params);
      }

      return {};
    }

    static route: string = route;

    static Match(url: string) {
      return makeMatcher()(route, url);
    }

    override state = {
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
