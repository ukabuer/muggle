import { useAppContext } from "muggle";
import { type FunctionComponent, h } from "preact";

const Loading: FunctionComponent = () => {
  const { loading } = useAppContext();
  return <div className="page-loader">{loading ? <div /> : null}</div>;
};

export default Loading;
