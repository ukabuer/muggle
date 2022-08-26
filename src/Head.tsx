import { Component, cloneElement, VNode, ComponentChildren } from "preact";

type AnyVNode = VNode<any>; // eslint-disable-line

const METATYPES = ["name", "httpEquiv", "charSet", "itemProp"];

let mounted: Component[] = [];

function isVNode(h: ComponentChildren): h is AnyVNode {
  return !Array.isArray(h) && !!Object.getOwnPropertyDescriptor(h, "type");
}

// returns a function for filtering head child elements
// which shouldn't be duplicated, like <title/>.
function unique() {
  const tags: string[] = [];
  const metaTypes: string[] = [];
  const metaCategories: Record<string, string[]> = {};
  return (h: ComponentChildren): h is AnyVNode => {
    if (!isVNode(h)) return false;

    switch (h.type) {
      case "title":
      case "base":
        if (~tags.indexOf(h.type)) return false;
        tags.push(h.type);
        break;
      case "meta":
        for (let i = 0, len = METATYPES.length; i < len; i += 1) {
          const metatype = METATYPES[i];
          if (!Object.prototype.hasOwnProperty.call(h.props, metatype)) {
            continue;
          }
          if (metatype === "charSet") {
            if (~metaTypes.indexOf(metatype)) return false;
            metaTypes.push(metatype);
          } else {
            const category = h.props[metatype];
            const categories = metaCategories[metatype] || [];
            if (~categories.indexOf(category)) return false;
            categories.push(category);
            metaCategories[metatype] = categories;
          }
        }
        break;
      default:
        break;
    }
    return true;
  };
}

function reducer(
  components: Component["props"][],
  exportMode = false
): AnyVNode[] {
  const allChildren: ComponentChildren[] = [];
  for (const c of components) {
    if (c.children) {
      if (Array.isArray(c.children)) {
        allChildren.push(...c.children);
      } else {
        allChildren.push(c.children);
      }
    }
  }

  return allChildren
    .reverse()
    .filter(unique())
    .reverse()
    .filter((c) =>
      exportMode ? typeof c.type !== "string" || c.type !== "style" : true
    )
    .map((c) => {
      if (
        typeof c.type === "string" &&
        c.type === "style" &&
        !("dangerouslySetInnerHTML" in c.props) &&
        "children" in c.props &&
        typeof c.props["children"] !== "object"
      ) {
        c.props["dangerouslySetInnerHTML"] = {
          __html: String(c.props.children || ""),
        };
        c.props["children"] = null;
      }

      return c;
    })
    .map((c) => cloneElement(c));
}

export default class Head extends Component {
  static rewind(exportMode: boolean) {
    const state = reducer(
      mounted.map((mount) => mount.props),
      exportMode
    );
    mounted = [];
    return state;
  }

  override componentWillMount() {
    mounted.push(this);
  }

  render() {
    return null;
  }
}
