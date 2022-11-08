import { hydrate, h } from "preact";
import { ComponentModule } from "./entry-server.js";

function error(reason: string, id: number, name?: string) {
  console.log(`Invalid component(id=${id}, name=${name}): ${reason}`);
}

export default function hydrateIslands(
  islands: Record<string, ComponentModule>,
) {
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

    const HComponent = islands[componentName].default;
    const props = allProps[id];
    if (!HComponent || typeof props !== "object") {
      error("invalid component", id, componentName);
      return;
    }

    const parent = script.parentNode;
    if (!parent) {
      return;
    }

    const end = parent.querySelector(`script[data-muggle-end-id="${id}"]`);
    if (!end) {
      error("no end tag", id, componentName);
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
    // eslint-disable-next-line
    hydrate(<HComponent {...props} />, fakeRoot as any);

    parent.removeChild(script);
    parent.removeChild(end);
  });
}
