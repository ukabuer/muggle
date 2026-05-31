import { Head } from "muggle";
import { type FunctionComponent, h } from "preact";
import Layout from "../components/Layout";

const AboutPage: FunctionComponent = () => (
  <Layout>
    <Head>
      <title>About Page</title>
    </Head>
    <p>This is about page.</p>
  </Layout>
);

export default AboutPage;
