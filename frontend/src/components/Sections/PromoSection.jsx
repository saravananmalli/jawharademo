import { memo } from 'react';
import { Link } from 'react-router-dom';
import './PromoSection.scss';

function PromoSection() {
  return (
    <section className="promo-section">
      <div className="container">
        <div className="promo-section__grid">
          {/* Large left promo */}
          <div className="promo-card promo-card--large">
            <img
              src="/images/timeless-jewellery.png"
              alt="Jawhara Jewellery Shop"
              loading="lazy"
            />
            <div className="promo-card__overlay">
              
              <h3 className="promo-card__title">Timeless Jewellery for Every Moment</h3>
              <p className="promo-card__subtitle">Discover finely crafted pieces that add elegance, shine, and confidence to your everyday style.</p>
              <Link to="/collections" className="promo-card__btn promo-card__btn--sm">Shop Now →</Link>
            </div>
          </div>

          {/* Two stacked right promos */}
          <div className="promo-section__right">
            <div className="promo-card promo-card--small">
              <img
                src="/images/diana.png"
                alt="Solitaire Festival"
                loading="lazy"
              />
              <div className="promo-card__overlay promo-card__overlay--bottom">
                <h3 className="promo-card__title">Solitaire Festival</h3>
                <p className="promo-card__subtitle">Designed to celebrate beauty, grace, and unforgettable moments.</p>
                <Link to="/collections/solitaire" className="promo-card__btn promo-card__btn--sm">Explore →</Link>
              </div>
            </div>

            <div className="promo-card promo-card--small">
              <img
                src="/images/solitire.png"
                alt="Gold Jewellery"
                loading="lazy"
              />
              <div className="promo-card__overlay promo-card__overlay--bottom">
                <h3 className="promo-card__title">Gold Jewellery</h3>
                <p className="promo-card__subtitle">Explore modern jewellery crafted to match your bold and beautiful look.</p>
                <Link to="/category/necklaces" className="promo-card__btn promo-card__btn--sm">Shop →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PromoSection);
