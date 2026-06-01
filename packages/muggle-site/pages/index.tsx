import { randomUUID } from "node:crypto";
import { Head, Style } from "muggle";
import { type FunctionComponent, h } from "preact";
import Layout from "../components/Layout";
import Counter from "../islands/Counter";
import styles from "./style.module.css";
import css from "./style.module.css?inline";

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
    <div className={styles.wrapper}>
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
