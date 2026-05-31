import { Fragment, type FunctionComponent, h } from "preact";
import { useState } from "preact/hooks";

type Props = {
  initial: number;
};

const Counter: FunctionComponent<Props> = (props: Props) => {
  const [value, setValue] = useState(props.initial);
  return (
    <>
      <button type="button" onClick={() => setValue((v) => v - 1)}>
        -
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => setValue((v) => v + 1)}>
        +
      </button>
    </>
  );
};

export default Counter;
