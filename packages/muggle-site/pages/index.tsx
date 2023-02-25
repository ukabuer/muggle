import { h, FunctionComponent } from "preact";
import { Head, Style } from "muggle";
import Counter from "../islands/Counter";
import { randomUUID } from "node:crypto";
import css from "./style.scss?inline";
import Layout from "../components/Layout";

type Props = {
  page: string;
};

const IndexPage: FunctionComponent<Props> = ({ page }: Props) => (
  <Layout>
    <Head>
      <title>Index Page</title>
      <Style>{css}</Style>
    </Head>
    <p>This is index page</p>
    <p>Async data: {page}</p>
    <p>Random UUID using `node:crypto`: {randomUUID()}</p>
    <div>
      <span>An interactive counter: </span>
      <Counter initial={0} />
    </div>
  </Layout>
);

export async function preload() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Hello world");
    }, 100);
  });
}

export default IndexPage;
