import { h, FunctionComponent } from "preact";
import Head from "../../src/client/Head";

import Counter from "../islands/Counter";

type Props = {
  page: string;
}

const IndexPage: FunctionComponent<Props> = ({ page }: Props) => (
  <div>
    <Head>
      <title>Index Page</title>
    </Head>
    <h1>Index Page</h1>
    <p>{page}</p>
    <Counter initial={100} />
  </div>
);

export async function preload() {
  return "Hello world";
}

export default IndexPage;
