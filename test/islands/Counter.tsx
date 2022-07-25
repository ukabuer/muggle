import { h, Fragment, FunctionComponent } from "preact";
import { useState } from "preact/hooks";

type Props = {
  initial: number;
};

const Counter: FunctionComponent<Props> = (props) => {
  const [value, setValue] = useState(props.initial);
  return (
    <>
      <button onClick={() => setValue((v) => v - 1)}>-</button>
      <span>{value}</span>
      <button onClick={() => setValue((v) => v + 1)}>+</button>
    </>
  );
};

export default Counter;
