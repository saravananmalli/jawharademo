import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiMapPin, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDeliverySettings } from '../context/DeliverySettingsContext';
import { formatPrice } from '../utils/formatPrice';
import { DirhamSymbol } from 'dirham/react';
import api from '../services/api';
import './Checkout.scss';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const EMPTY_FORM = { name: '', phone: '', street: '', city: '', emirate: 'Dubai' };

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isDeliveryAvailable, deliverySettings } = useDeliverySettings();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY_FORM, name: user?.name || '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const shipping = subtotal >= 500 ? 0 : 25;
  const total = subtotal + shipping;

  if (!isAuthenticated) {
    return (
      <main className="checkout-gate">
        <div className="container">
          <FiShoppingBag className="checkout-gate__icon" />
          <h2>Sign in to Checkout</h2>
          <p>You need to be logged in to place an order.</p>
          <Link to="/login?redirect=/checkout" className="checkout-gate__btn">Sign In</Link>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="checkout-gate">
        <div className="container">
          <FiShoppingBag className="checkout-gate__icon" />
          <h2>Your cart is empty</h2>
          <p>Add items to your cart before checking out.</p>
          <Link to="/" className="checkout-gate__btn">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  if (!isDeliveryAvailable) {
    return (
      <main className="checkout-gate">
        <div className="container">
          <FiMapPin className="checkout-gate__icon" style={{ color: '#c4a960' }} />
          <h2>Delivery Not Available</h2>
          <p>{deliverySettings.restrictionMessage}</p>
          <Link to="/cart" className="checkout-gate__btn">Back to Cart</Link>
        </div>
      </main>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.street.trim()) e.street = 'Street address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.emirate) e.emirate = 'Emirate is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      const orderItems = items.map(item => ({
        product: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || '',
        selectedSize: item.selectedSize || '',
      }));

      const { data } = await api.post('/orders', {
        items: orderItems,
        shippingAddress: { ...form, country: 'UAE' },
        subtotal,
        shippingFee: shipping,
        totalAmount: total,
      });

      clearCart();
      navigate(`/order-confirmation/${data.data._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="container">
        <Link to="/cart" className="checkout-page__back">
          <FiChevronLeft /> Back to Cart
        </Link>

        <h1 className="checkout-page__title">Checkout</h1>

        <div className="checkout-page__grid">
          {/* Shipping Form */}
          <section className="checkout-form">
            <div className="checkout-form__header">
              <FiMapPin />
              <h2>Shipping Address</h2>
            </div>

            {serverError && <p className="checkout-form__error">{serverError}</p>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="checkout-form__row">
                <div className="checkout-form__field">
                  <label>Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Sara Al Mansoori"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="checkout-form__field-error">{errors.name}</span>}
                </div>
                <div className="checkout-form__field">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+971 50 000 0000"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="checkout-form__field-error">{errors.phone}</span>}
                </div>
              </div>

              <div className="checkout-form__field">
                <label>Street Address</label>
                <input
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Villa / Flat no., Building, Street"
                  className={errors.street ? 'error' : ''}
                />
                {errors.street && <span className="checkout-form__field-error">{errors.street}</span>}
              </div>

              <div className="checkout-form__row">
                <div className="checkout-form__field">
                  <label>City / Area</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Al Barsha"
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="checkout-form__field-error">{errors.city}</span>}
                </div>
                <div className="checkout-form__field">
                  <label>Emirate</label>
                  <select
                    name="emirate"
                    value={form.emirate}
                    onChange={handleChange}
                    className={errors.emirate ? 'error' : ''}
                  >
                    {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                  {errors.emirate && <span className="checkout-form__field-error">{errors.emirate}</span>}
                </div>
              </div>

              <div className="checkout-form__field checkout-form__field--country">
                <label>Country</label>
                <input value="United Arab Emirates" disabled />
              </div>

              <button type="submit" className="checkout-form__submit" disabled={loading}>
                {loading ? 'Placing Order…' : <span>Place Order · <DirhamSymbol size="0.85em" />{formatPrice(total)}</span>}
              </button>
            </form>
          </section>

          {/* Order Summary */}
          <aside className="checkout-summary">
            <h2 className="checkout-summary__title">Order Summary</h2>

            <ul className="checkout-summary__items">
              {items.map(item => (
                <li key={item._id} className="checkout-summary__item">
                  <div className="checkout-summary__item-img-wrap">
                    <img
                      src={item.images?.[0] || `https://placehold.co/64x64/F5EFE6/C4A960?text=${encodeURIComponent(item.name[0])}`}
                      alt={item.name}
                    />
                    <span className="checkout-summary__item-qty">{item.quantity}</span>
                  </div>
                  <div className="checkout-summary__item-info">
                    <p className="checkout-summary__item-name">{item.name}</p>
                    {item.selectedSize && <p className="checkout-summary__item-size">Size: {item.selectedSize}</p>}
                  </div>
                  <p className="checkout-summary__item-price">
                    <DirhamSymbol size="0.8em" />{formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="checkout-summary__totals">
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span><DirhamSymbol size="0.8em" />{formatPrice(subtotal)}</span>
              </div>
              <div className="checkout-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : <><DirhamSymbol size="0.8em" />{formatPrice(shipping)}</>}</span>
              </div>
              {shipping === 0 && (
                <p className="checkout-summary__free-shipping">Free shipping on orders over <DirhamSymbol size="0.85em" /> 500</p>
              )}
              <div className="checkout-summary__divider" />
              <div className="checkout-summary__row checkout-summary__row--total">
                <span>Total</span>
                <span><DirhamSymbol size="0.8em" />{formatPrice(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
