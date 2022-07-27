import { h, FunctionComponent } from "preact";
import Head from "../../src/client/Head";

import Counter from "../islands/Counter";

const IndexPage: FunctionComponent = () => (
  <div>
    <Head>
      <title>Index Page</title>
    </Head>
    <h1>Index Page</h1>
    <Counter initial={100} />
  </div>
);

export default IndexPage;
