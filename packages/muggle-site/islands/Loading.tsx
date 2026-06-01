import { useAppContext } from "muggle";
import { type FunctionComponent, h } from "preact";
import styles from "../components/style.module.css";

const Loading: FunctionComponent = () => {
  const { loading } = useAppContext();
  return <div className={styles.pageLoader}>{loading ? <div /> : null}</div>;
};

export default Loading;
