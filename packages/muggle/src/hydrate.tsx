import { hydrate, render, ComponentType, h, FunctionComponent } from "preact";
import { AppContext, EventsManager } from "./client.js";
import { useEffect, useState } from "preact/hooks";

export type ComponentModule = {
  default: ComponentType<unknown>;
};

type NavigationData = {
  path: string;
  loading: boolean;
};

function error(reason: string, id: number, name?: string) {
  console.log(`Invalid component(id=${id}, name=${name}): ${reason}`);
}

const AppContextWrapper: FunctionComponent = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    function handleNavigation(v: NavigationData) {
      setLoading(v.loading);
      setPath(v.path);
    }

    EventsManager.on("navigate", handleNavigation);

    return () => {
      EventsManager.off("navigate", handleNavigation);
    };
  }, []);

  return (
    <AppContext.Provider value={{ path, loading }}>
      {children}
    </AppContext.Provider>
  );
};

// rome-ignore lint/suspicious/noExplicitAny: fake root nodes
let HydratedIslands: Record<string, any> = {};

export default function hydrateIslands(
  islands: Record<string, ComponentModule>,
) {
  const propsJsonEl = document.getElementById("__MUGGLE_ISLAND_PROPS");
  if (!propsJsonEl) {
    return;
  }

  const allProps: unknown[] = JSON.parse(propsJsonEl?.textContent ?? "[]");

  const hydratable = document.querySelectorAll("script[data-muggle-id]");
  console.log(`hydratable: ${hydratable.length}`);
  hydratable.forEach((script) => {
    const el = script as HTMLElement;
    const id = el.dataset.muggleId || "";

    const index = parseInt(el.dataset.index || "", 10);
    const componentName = el.dataset.component;

    if (index < 0 || index >= allProps.length || !componentName) {
      error("invalid id", index, componentName);
      return;
    }

    if (!islands[componentName]) {
      error("invalid id", index, componentName);
      return;
    }

    const HComponent = islands[componentName].default;
    const props = allProps[index];
    if (!HComponent || typeof props !== "object") {
      error("invalid component", index, componentName);
      return;
    }

    const parent = script.parentNode;
    if (!parent) {
      return;
    }

    const end = parent.querySelector(`script[data-muggle-end-id="${id}"]`);
    if (!end) {
      error("no end tag", index, componentName);
      return;
    }

    const children = [];
    let current = script.nextSibling;
    while (current !== end) {
      children.push(current);
      current = current ? current.nextSibling : null;
    }

    function insert(c: Node, r: Node) {
      parent?.insertBefore(c, r || end);
    }

    const fakeRoot = {
      nodeType: 1,
      parentNode: parent,
      firstChild: children[0],
      childNodes: children,
      insertBefore: insert,
      appendChild: insert,
      removeChild: (c: Node) => {
        parent.removeChild(c);
      },
    };

    hydrate(
      <AppContextWrapper>
        <HComponent {...props} />
      </AppContextWrapper>,
      // rome-ignore lint/suspicious/noExplicitAny: fake root node
      fakeRoot as any,
    );

    // rome-ignore lint/suspicious/noExplicitAny: fake root node
    HydratedIslands[id] = fakeRoot as any;

    console.log(`Hydrated for id=${index}, name=${componentName}`);
    parent.removeChild(script);
    parent.removeChild(end);
  });

  propsJsonEl.parentNode?.removeChild(propsJsonEl);
}

let HTMLParser: DOMParser | null = null;

const PJAXWrapperSelector = "[data-pjax-wrapper]";

function cloneScriptTag(node: Element) {
  const newTag = document.createElement("script");
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    newTag.setAttribute(attr.nodeName, attr.nodeValue || "");
  }
  newTag.innerHTML = node.innerHTML;
  return newTag;
}

export function enablePJAX(islands: Record<string, ComponentModule>) {
  let loading = false;
  let leaving = false;
  let entering = false;
  let location = window.location.href;
  let targetLocation = "";
  let wrapper: Element | null = null;

  const enter = async (
    url: string,
    page: Document,
    back: boolean,
  ): Promise<boolean> => {
    if (!wrapper || url !== targetLocation) {
      return false;
    }

    location = targetLocation;
    if (!back) {
      window.history.pushState({}, "", url);
    }

    const oldContent = wrapper;
    const parent = oldContent.parentNode;
    const nextSibling = oldContent.nextSibling;
    if (!parent) {
      window.location.href = targetLocation;
      return false;
    }

    // remove old content
    leaving = true;
    // maybe await some transition here
    // unmount hydrated islands
    Object.values(HydratedIslands).forEach((old) => {
      // rome-ignore lint/suspicious/noExplicitAny: islands are mounted with fake root node
      render(null, old as any);
    });
    HydratedIslands = {};
    parent.removeChild(oldContent);
    leaving = false;

    // add new content
    entering = true;
    const newContent = page.querySelector(PJAXWrapperSelector);
    if (!newContent) {
      window.location.href = targetLocation;
      return false;
    }

    function mergeHeadItems(tag: string) {
      const filter = `head ${tag}`;
      const newItems = Array.from(page.querySelectorAll(filter));
      const existItems = Array.from(document.querySelectorAll(filter));
      newItems.forEach((newItem) => {
        for (const existItem of existItems) {
          if (existItem.outerHTML === newItem.outerHTML) {
            if ((existItem as HTMLElement).dataset.pjaxReload !== undefined) {
              // force reload
              existItem.parentNode?.replaceChild(
                cloneScriptTag(newItem),
                existItem,
              );
            }
            return;
          }
        }

        if (tag === "script") {
          newItem = cloneScriptTag(newItem);
        }
        document.head.appendChild(newItem);
      });
    }

    // update title
    document.title = page.title;

    // merge new links and styles
    ["link", "style"].forEach(mergeHeadItems);

    if (nextSibling) {
      wrapper = parent.insertBefore(newContent, nextSibling);
    } else {
      wrapper = parent.appendChild(newContent);
    }
    window.scrollTo(0, 0);

    // merge new scripts
    mergeHeadItems("script");

    // hydrate islands in new page
    hydrateIslands(islands);

    // maybe await some transition here
    entering = false;
    return true;
  };

  const request = async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: { "X-Requested-With": "MUGGLE_PJAX" },
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw Error("Failed to load the new page.");
      }

      const html = await response.text();

      if (!HTMLParser) {
        HTMLParser = new DOMParser();
      }

      return HTMLParser.parseFromString(html, "text/html");
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      }

      window.location.href = url;
    }
  };

  const goto = async (target: URL, back = false) => {
    const url = target.toString();
    targetLocation = url;

    loading = true;
    EventsManager.emit("navigate", {
      loading,
      path: new URL(location).pathname,
    } as NavigationData);

    const page = await request(url);
    if (page) {
      const entered = await enter(url, page, back);

      if (!entered) return;

      loading = false;
      EventsManager.emit("navigate", {
        loading,
        path: target.pathname,
      } as NavigationData);
    }
  };

  const onClick = (ev: MouseEvent) => {
    if (ev.metaKey || ev.ctrlKey || !ev.target) {
      return;
    }

    const el = ev.target as Element;
    const rule = "a:not([target]):not([href^=\\#]):not([data-no-pjax])";
    if (!el.matches(rule)) {
      return;
    }

    const link = el as HTMLLinkElement;
    const dest = new URL(link.href);
    const curLocation = new URL(window.location.href);

    if (dest.host !== curLocation.host) {
      return;
    }

    if (
      dest.href !== curLocation.href ||
      (curLocation.hash.length > 0 && dest.hash.length === 0)
    ) {
      ev.preventDefault();
      goto(dest);
    }
  };

  const onPopstate = (ev: PopStateEvent) => {
    const curURL = new URL(location);
    if (window.location.pathname === curURL.pathname && !loading) {
      return false;
    }

    goto(new URL(window.location.href), true);
  };

  const el = document.querySelector(PJAXWrapperSelector);
  if (!el) return;

  wrapper = el;

  document.addEventListener("click", onClick);
  window.addEventListener("popstate", onPopstate);
  console.log("[muggle]: PJAX enabled.");
}
