import { options, h, Fragment, ComponentType, FunctionComponent } from "preact";
import renderToString from "preact-render-to-string";
import { createRouter } from "./routing.js";
import { ComponentModule } from "./hydrate.js";
import {
  ServerRenderContext,
  ServerRenderContextData,
  useServerRenderContext,
} from "./context.js";
import { AppContext } from "./client.js";

export type CustomRenderFn = (
  params: Record<string, string>,
  context: ServerRenderContextData,
  data: unknown,
) => Promise<string>;

export type PageModule = {
  default: ComponentType<{ page?: unknown }> | CustomRenderFn;
  preload?: (params: Record<string, string>) => Promise<unknown>;
};

export type RenderedStyle = { map: Map<string, string>; order: string[] };

export type RenderResult =
  | null
  | {
      custom: false;
      content: [string, RenderedStyle, string];
    }
  | {
      custom: true;
      content: string;
    };

export function hook(
  islands: Record<string, ComponentModule>,
  context: ServerRenderContextData,
) {
  const originalHook = options.vnode;
  let ignoreNext = false;
  options.vnode = (vnode) => {
    const OriginalType = vnode.type as ComponentType<unknown>;
    if (typeof vnode.type === "function") {
      const island = Object.entries(islands).find(
        ([, component]) => component.default === OriginalType,
      );
      if (island) {
        if (ignoreNext) {
          ignoreNext = false;
          return;
        }
        vnode.type = (props) => {
          ignoreNext = true;
          context.islandsProps.push(props);
          const component = island[0];
          const index = context.islandsProps.length - 1;
          const id = `${component}-${index}`;
          return (
            <>
              <script
                data-muggle-id={id}
                data-component={component}
                data-index={index}
              />
              <OriginalType {...props} />
              <script data-muggle-end-id={id} />
            </>
          );
        };
      }
    }
    if (originalHook) {
      originalHook(vnode);
    }
  };
}

export const Scripts: FunctionComponent = () => {
  const { islandsProps } = useServerRenderContext();
  return (
    <script
      id="__MUGGLE_ISLAND_PROPS"
      type="application/json"
      // rome-ignore lint: need use dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(islandsProps),
      }}
    />
  );
};

async function renderPage(
  path: string,
  params: Record<string, string>,
  page: PageModule,
  context: ServerRenderContextData,
): Promise<[string, RenderedStyle, string]> {
  context.reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload(params);
  }
  const Content = page.default as ComponentType<{ page?: unknown }>;

  context.path = path;
  const body = renderToString(
    <ServerRenderContext.Provider value={context}>
      <AppContext.Provider value={{ path, loading: false }}>
        <Content page={props} />
      </AppContext.Provider>
    </ServerRenderContext.Provider>,
  );

  let head = renderToString(
    <ServerRenderContext.Provider value={context}>
      {h(
        "head",
        null,
        context.heads.title,
        context.heads.base,
        context.heads.meta.charSet,
        Object.values(context.heads.meta.others),
        context.heads.others,
        <Scripts />,
      )}
    </ServerRenderContext.Provider>,
  );

  // REVIEW: heads need vite's entry script?
  const prefix = "<head>";
  const postfix = "</head>";
  head = head.substring(prefix.length, head.length - postfix.length);

  const styles = {
    order: context.stylesOrder,
    map: context.styles,
  };

  return [head, styles, body];
}

async function renderCustomPage(
  path: string,
  params: Record<string, string>,
  page: PageModule,
  context: ServerRenderContextData,
): Promise<string> {
  const render = page.default as CustomRenderFn;

  context.reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload(params);
  }

  return render(params, context, props);
}

export default function createRenderer(
  pages: Record<string, ComponentModule>,
  islands: Record<string, ComponentModule>,
) {
  const context: ServerRenderContextData = {
    path: "",
    exportMode: false,
    islandsProps: [],
    heads: {
      title: null,
      base: null,
      meta: {
        charSet: null,
        others: {},
      },
      others: [],
    },
    styles: new Map(),
    stylesOrder: [],
    reset() {
      this.heads = {
        title: null,
        base: null,
        meta: {
          charSet: null,
          others: {},
        },
        others: [],
      };
      this.islandsProps = [];
      this.styles.clear();
      this.stylesOrder = [];
    },
    addStyle(id, style) {
      if (!this.styles.has(id)) {
        this.stylesOrder.push(id);
      }
      this.styles.set(id, style);
    },
  };

  hook(islands, context);

  const router = createRouter(pages);

  return async (url: string, exportMode = false): Promise<RenderResult> => {
    const matched = router.find("GET", url);
    if (!matched) {
      return null;
    }

    const { handler, params, searchParams } = matched;
    const store: { customExt?: string; page?: PageModule } = {};
    // rome-ignore lint/suspicious/noExplicitAny: fake req/res
    handler(null as any, null as any, params, store, searchParams);

    if (!store.page) {
      return null;
    }

    if (store.customExt) {
      return {
        custom: true,
        content: await renderCustomPage(
          url,
          params as Record<string, string>,
          store.page,
          context,
        ),
      };
    }

    context.exportMode = exportMode;
    const content = await renderPage(
      url,
      params as Record<string, string>,
      store.page,
      context,
    );
    return {
      custom: false,
      content,
    };
  };
}
