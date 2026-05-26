import { Link } from 'react-router-dom';
import './NotFound.scss';

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found__inner">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page Not Found</h2>
        <p className="not-found__desc">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="not-found__btn">Back to Home</Link>
      </div>
    </main>
  );
}
