import {
  cloneElement,
  VNode,
  ComponentChildren,
  FunctionComponent,
} from "preact";
import { useServerRenderContext } from "../context.js";

function isVNode(h: ComponentChildren): h is VNode<unknown> {
  return !Array.isArray(h) && !!Object.getOwnPropertyDescriptor(h, "type");
}

const Head: FunctionComponent = ({ children }) => {
  const { heads } = useServerRenderContext();

  let nodes: ComponentChildren[] = [];
  if (Array.isArray(children)) {
    nodes = children;
  } else if (children) {
    nodes = [children];
  }

  for (const node of nodes) {
    if (!isVNode(node)) {
      continue;
    }

    const type = node["type"];
    if (typeof type !== "string") {
      heads.others.push(node);
      continue;
    }

    // some tags need to be unique
    switch (type) {
      case "title": {
        heads.title = node;
        break;
      }
      case "base": {
        heads.base = node;
        break;
      }
      case "meta": {
        const props = node.props as Record<string, unknown>;
        if (props["charSet"] || props["charset"]) {
          heads.meta.charSet = node;
        } else if (props["name"] && typeof props["name"] === "string") {
          const name = props["name"];
          heads.meta.others[name] = node;
        } else {
          heads.others.push(node);
        }
        break;
      }
      case "style":
      case "script": {
        if (
          typeof node.props.children === "string" &&
          !node.hasOwnProperty("dangerouslySetInnerHTML")
        ) {
          const newNode = cloneElement(node, {
            dangerouslySetInnerHTML: {
              __html: node.props.children,
            },
          });
          heads.others.push(newNode);
          break;
        }

        heads.others.push(node);
        break;
      }
      default: {
        heads.others.push(node);
      }
    }
  }

  return null;
};

export default Head;
