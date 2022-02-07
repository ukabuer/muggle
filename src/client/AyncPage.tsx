/* eslint-disable no-param-reassign, no-restricted-syntax */
import unfetch from "isomorphic-unfetch";
import { Component, ComponentType } from "preact";
import makeMatcher from "wouter-preact/matcher";
import { AsyncPageType, Module } from "./types.js";
import AppContext from "./context.js";

type AsyncPageStateType<P> = { Page: ComponentType<P> | null };

function createAsyncPage<Props>(
  route: string,
  loader: () => Promise<Module<ComponentType<Props>>>,
  fetch: typeof unfetch,
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
    // eslint-disable-next-line no-shadow, no-unused-vars
    | ((fetch: typeof window.fetch, params?: unknown) => Promise<unknown>)
    | null = null;

  const AsyncPage: AsyncPageType<Props> = class _ extends Component<
    Props, AsyncPageStateType<Props>
  > {
    static route: string = route;

    static async Load(params?: unknown) {
      if (LoadedComponent == null) {
        // console.log(`route \`${route}\` LoadComponent`);
        await AsyncPage.LoadComponent();
        // console.log(`route \`${route}\` LoadedComponent ${LoadedComponent !== null}`);
      }

      if (GetPageDataFn != null) {
        // console.log(`route \`${route}\` GetPageDataFn`);
        return GetPageDataFn(fetch, params);
      }

      return {};
    }

    static async LoadComponent() {
      try {
        const m = await loader();
        LoadedComponent = m.default || null;
        GetPageDataFn = m.preload || null;
      } catch (e: unknown) {
        console.error(`route \`${route}\` LoadComponent error: ${(e as Error).toString()}`);
      }
    }

    static Match(url: string) {
      return makeMatcher()(route, url);
    }

    constructor() {
      super();
      this.state = {
        Page: LoadedComponent,
      };
    }

    render() {
      const { Page } = this.state;

      if (Page == null) {
        return null;
      }

      return (
        <AppContext.Consumer>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          {(value) => <Page {...this.props} page={value.page} />}
        </AppContext.Consumer>
      );
    }
  };

  return AsyncPage;
}

export { createAsyncPage };

export default createAsyncPage;
