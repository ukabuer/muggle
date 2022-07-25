import { h, FunctionComponent } from "preact";

import Counter from "../islands/Counter";

const IndexPage: FunctionComponent = () => {
  return (
    <div>
      <h1>Index Page</h1>
      <Counter initial={100} />
    </div>
  );
};

export default IndexPage;
