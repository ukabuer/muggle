import { h, FunctionComponent } from "preact";
import { Head } from "muggle";
import Header from "../components/Header";
import Counter from "../islands/Counter";
import { randomUUID } from "node:crypto";

type Props = {
  page: string;
};

const IndexPage: FunctionComponent<Props> = ({ page }: Props) => (
  <div>
    <Head>
      <title>Index Page</title>
    </Head>
    <Header />
    <p>This is index page</p>
    <p>Async data: {page}</p>
    <p>Random UUID using `node:crypto`: {randomUUID()}</p>
    <div>
      <span>An interactive counter: </span>
      <Counter initial={0} />
    </div>
  </div>
);

export async function preload() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Hello world");
    }, 100);
  });
}

export default IndexPage;
