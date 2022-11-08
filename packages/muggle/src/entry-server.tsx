import { options, h, Fragment, ComponentType, VNode } from "preact";
import renderToString from "preact-render-to-string";
import { PageModule } from "./server.js";
import { createRouter } from "./routing.js";
import Layout from "./components/Layout.js";
import Head from "./components/Head.js";
import { ServerRenderContext, ServerRenderContextData } from "./context.js";

export type ComponentModule = {
  default: ComponentType<unknown>;
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
          const id = context.islandsProps.length - 1;
          return (
            <>
              <script data-muggle-id={id} data-muggle-component={island[0]} />
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

async function renderPage(
  path: string,
  params: Record<string, string>,
  page: PageModule,
  context: ServerRenderContextData,
) {
  context.reset();
  let props: unknown | undefined;
  if (page.preload) {
    props = await page.preload(params);
  }
  const Content = page.default;

  context.path = path;
  const body = renderToString(
    <ServerRenderContext.Provider value={context}>
      <Layout>
        <Content page={props} />
      </Layout>
    </ServerRenderContext.Provider>,
  );
  const head = Head.rewind()
    .map((n: VNode) => renderToString(n))
    .join("");

  return [head, body];
}

export default function createRenderer(
  pages: Record<string, ComponentModule>,
  islands: Record<string, ComponentModule>,
) {
  const context: ServerRenderContextData = {
    islandsProps: [],
    exportMode: false,
    reset() {
      this.islandsProps = [];
    },
    path: "",
  };

  hook(islands, context);

  const router = createRouter(pages);

  return (url: string, exportMode = false) => {
    const matched = router.find("GET", url);
    if (!matched) {
      return Promise.resolve(null);
    }

    const { handler, params, searchParams } = matched;
    const store: { page?: PageModule } = {};
    handler(null as any, null as any, params, store, searchParams);

    if (!store.page) {
      return null;
    }

    context.exportMode = exportMode;
    return renderPage(
      url,
      params as Record<string, string>,
      store.page,
      context,
    );
  };
}
