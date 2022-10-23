import { h, FunctionComponent } from "preact";

const dev = false;

type Props = {
  inline?: boolean;
  children: string;
};

const Style: FunctionComponent<Props> = (props: Props) => {
  if (props.inline || dev) {
    const css = props.children;

    return <style dangerouslySetInnerHTML={{ __html: css }}></style>;
  }

  // in export mode, imported css file will be empty string
  // vite will extract them into a bundled file
  /* FIX_ME
   * 1. non-inline and manually written css should be bundled as well
   * 2. inline css should not be bundle and avoid dumplication
   */
  return null;
};

export default Style;
