import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiShoppingBag, FiMapPin } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDeliverySettings } from '../context/DeliverySettingsContext';
import { Button, PriceDisplay, QuantityControl, EmptyState } from '../components/Common';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import { DirhamSymbol } from 'dirham/react';
import './Cart.scss';

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isDeliveryAvailable, deliverySettings } = useDeliverySettings();
  const shipping = subtotal >= 500 ? 0 : 25;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (!items.length) {
    return (
      <main className="cart-empty-page">
        <div className="container">
          <EmptyState
            icon={<FiShoppingBag />}
            title={t.cart.emptyCart}
            description="Add some beautiful jewelry to get started."
            cta={{ label: t.cart.continueShopping, onClick: () => navigate('/') }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container">
        <h1 className="cart-page__title">{t.cart.myCart} ({items.length})</h1>

        <div className="cart-page__grid">
          <div className="cart-page__items">
            {items.map(item => (
              <div key={item._id} className="cart-item">
                <img
                  src={getImageUrl(item.images?.[0]) || `https://placehold.co/100x100/F5EFE6/C4A960?text=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  className="cart-item__image"
                  loading="lazy"
                />
                <div className="cart-item__info">
                  <p className="cart-item__category">{item.category}</p>
                  <h3 className="cart-item__name">{item.name}</h3>
                  <p className="cart-item__meta">{item.metal} {item.metalKt}</p>
                </div>

                <QuantityControl
                  value={item.quantity}
                  onChange={(q) => updateQuantity(item._id, q)}
                  min={0}
                />

                <PriceDisplay price={item.price * item.quantity} size="md" />

                <button className="cart-item__remove" onClick={() => removeItem(item._id)} aria-label="Remove item">
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-page__summary">
            <h3 className="cart-summary__title">Order Summary</h3>
            <div className="cart-summary__row">
              <span>{t.cart.subtotal}</span>
              <span><DirhamSymbol size="0.85em" />{formatPrice(subtotal)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : <><DirhamSymbol size="0.85em" />{formatPrice(shipping)}</>}</span>
            </div>
            <div className="cart-summary__divider" />
            <div className="cart-summary__row cart-summary__row--total">
              <span>{t.cart.total}</span>
              <span><DirhamSymbol size="0.85em" />{formatPrice(subtotal + shipping)}</span>
            </div>
            {!isDeliveryAvailable && (
              <div className="cart-restriction-notice">
                <FiMapPin />
                <span>{deliverySettings.restrictionMessage}</span>
              </div>
            )}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleCheckout}
              disabled={!isDeliveryAvailable}
            >
              {t.cart.checkout}
            </Button>
            <Link to="/" className="cart-summary__continue">{t.cart.continueShopping}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
