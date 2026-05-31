import crypto from "node:crypto";
import { type FunctionComponent, h } from "preact";
import { useServerRenderContext } from "../context.js";

type Props = {
  inline?: boolean;
  id?: string;
  children: string;
};

const Style: FunctionComponent<Props> = (props: Props) => {
  const context = useServerRenderContext();

  const css = props.children;
  if (typeof css !== "string") {
    return null;
  }

  if (props.inline || !context.exportMode) {
    return <style dangerouslySetInnerHTML={{ __html: css }}></style>;
  }

  // in export mode, non-inline styles will be bundled into a css file
  const id = props.id || crypto.createHash("md5").update(css).digest("hex");
  context.addStyle(id, css);

  return null;
};

export default Style;
