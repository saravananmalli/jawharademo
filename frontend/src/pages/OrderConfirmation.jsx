import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiMapPin, FiShoppingBag } from 'react-icons/fi';
import { formatPrice } from '../utils/formatPrice';
import { DirhamSymbol } from 'dirham/react';
import api from '../services/api';
import './OrderConfirmation.scss';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="order-confirm">
        <div className="container order-confirm__loading">
          <div className="order-confirm__spinner" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="order-confirm">
        <div className="container order-confirm__not-found">
          <FiPackage />
          <h2>Order not found</h2>
          <Link to="/">Go to Home</Link>
        </div>
      </main>
    );
  }

  const addr = order.shippingAddress;

  return (
    <main className="order-confirm">
      <div className="container">
        <div className="order-confirm__card">
          {/* Success Header */}
          <div className="order-confirm__header">
            <FiCheckCircle className="order-confirm__icon" />
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your order. We'll start processing it right away.</p>
            <span className="order-confirm__id">Order ID: <strong>#{id.slice(-8).toUpperCase()}</strong></span>
          </div>

          <div className="order-confirm__body">
            {/* Items */}
            <section className="order-confirm__section">
              <h2><FiPackage /> Items Ordered</h2>
              <ul className="order-confirm__items">
                {order.items.map((item, i) => (
                  <li key={i} className="order-confirm__item">
                    <img
                      src={item.image || `https://placehold.co/56x56/F5EFE6/C4A960?text=${encodeURIComponent(item.name?.[0] || 'J')}`}
                      alt={item.name}
                    />
                    <div className="order-confirm__item-info">
                      <p className="order-confirm__item-name">{item.name}</p>
                      <p className="order-confirm__item-meta">Qty: {item.quantity}{item.selectedSize ? ` · Size: ${item.selectedSize}` : ''}</p>
                    </div>
                    <p className="order-confirm__item-price">
                      <DirhamSymbol size="0.8em" />{formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Shipping Address */}
            <section className="order-confirm__section">
              <h2><FiMapPin /> Shipping Address</h2>
              <div className="order-confirm__address">
                <p><strong>{addr.name}</strong></p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.emirate}</p>
                <p>{addr.country}</p>
                <p>{addr.phone}</p>
              </div>
            </section>

            {/* Price Breakdown */}
            <section className="order-confirm__section order-confirm__section--totals">
              <div className="order-confirm__row">
                <span>Subtotal</span>
                <span><DirhamSymbol size="0.8em" />{formatPrice(order.subtotal)}</span>
              </div>
              <div className="order-confirm__row">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? 'Free' : <><DirhamSymbol size="0.8em" />{formatPrice(order.shippingFee)}</>}</span>
              </div>
              <div className="order-confirm__divider" />
              <div className="order-confirm__row order-confirm__row--total">
                <span>Total Paid</span>
                <span><DirhamSymbol size="0.8em" />{formatPrice(order.totalAmount)}</span>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="order-confirm__footer">
            <Link to="/" className="order-confirm__btn order-confirm__btn--primary">
              <FiShoppingBag /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
