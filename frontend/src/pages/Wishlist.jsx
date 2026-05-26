import { useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductGrid from '../components/Products/ProductGrid';
import { EmptyState } from '../components/Common';
import './Wishlist.scss';

export default function Wishlist() {
  const { items } = useWishlist();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <main className="wishlist-page">
        <div className="container">
          <EmptyState
            icon={<FiHeart />}
            title="Your Wishlist is Empty"
            description="Save the pieces you love and come back to them later."
            cta={{ label: 'Browse Jewelry', onClick: () => navigate('/') }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="container">
        <h1 className="wishlist-page__title">My Wishlist ({items.length})</h1>
        <ProductGrid products={items} cols={4} />
      </div>
    </main>
  );
}
