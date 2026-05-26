import './PageLoader.scss';

export default function PageLoader() {
  return (
    <div className="page-loader" aria-label="Loading page">
      <div className="page-loader__ring">
        <div /><div /><div /><div />
      </div>
    </div>
  );
}
