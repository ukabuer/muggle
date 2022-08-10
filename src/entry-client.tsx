import { hydrate, h, ComponentType } from "preact";
import barba from "@barba/core";
// eslint-disable-next-line
// @ts-ignore
// import AllComponents from "MUGGLE_COMPONENTS";
const AllComponents: Record<string, ComponentType> = {};
import "preact/debug";

function error(reason: string, id: number, name?: string) {
  console.log(`Invalid component(id=${id}, name=${name}): ${reason}`);
}

function hydratePage() {
  const propsJsonEl = document.getElementById("__MUGGLE_ISLAND_PROPS");
  const allProps: unknown[] = JSON.parse(propsJsonEl?.textContent ?? "[]");

  const hydratable = document.querySelectorAll("script[data-muggle-id]");
  hydratable.forEach((script) => {
    const el = script as HTMLElement;
    const id = parseInt(el.dataset.muggleId || "", 10);
    const componentName = el.dataset.muggleComponent;

    if (Number.isNaN(id) || id < 0 || id >= allProps.length || !componentName) {
      error("invalid id", id, componentName);
      return;
    }

    const HComponent = AllComponents[componentName] as ComponentType;
    const props = allProps[id];
    if (!HComponent || typeof props !== "object") {
      error("invalid component", id, componentName);
      return;
    }

    const parent = script.parentNode;
    if (!parent) return;

    const end = parent.querySelector(`script[data-muggle-end-id="${id}"]`);
    if (!end) {
      error("no end tag", id, componentName);
      return;
    }

    const children = [];
    let current = script.nextSibling;
    while (current !== end) {
      children.push(current);
      current = current && current.nextSibling;
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
    // eslint-disable-next-line
    hydrate(<HComponent {...props} />, fakeRoot as any);

    parent.removeChild(script);
    parent.removeChild(end);
  });
}

barba.init({
  views: [
    {
      namespace: "home",
      afterEnter() {
        setTimeout(() => {
          hydratePage();
        });
      },
    },
  ],
});
