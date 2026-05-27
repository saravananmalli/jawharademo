import { memo } from 'react';
import './TrustSection.scss';

const TRUST_ITEMS = [
  {
    image: '/icons/certificate.png',
    title: '100% Certified',
    desc: 'All diamonds independently certified',
  },
  {
    image: '/icons/shipping.png',
    title: 'Complementary Free Shipping',
    desc: 'On all orders above AED 500',
  },
  {
    image: '/icons/payment.png',
    title: 'All Payment Methods',
    desc: 'Dont bother with payment details.',
  },
  {
    image: '/icons/support.png',
    title: 'Online Support',
    desc: 'Expert jewellery consultation 24/7',
  },
];

function TrustSection() {
  return (
    <section className="home__rows container trust-section">
      <div className="trust-section__inner container">
        {TRUST_ITEMS.map(item => (
          <div key={item.title} className="trust-item">
            <div className="trust-item__icon">
              <img src={item.image} alt={item.title} width="40" height="40" />
            </div>
            <div className="trust-item__text">
              <h4 className="trust-item__title">{item.title}</h4>
              <p className="trust-item__desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(TrustSection);
