import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { cachedGet } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import './OfferBannerSection.scss';

function OfferBannerSection() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    cachedGet('/banners', { params: { placement: 'offer' }, ttl: 300_000 })
      .then(({ data }) => {
        const list = data.data || [];
        if (list.length > 0) setBanner(list[0]);
      })
      .catch(() => {});
  }, []);

  if (!banner) return null;

  const href = (() => {
    if (banner.redirectUrl) return banner.redirectUrl;
    if (banner.bannerType === 'category'   && banner.linkedCategory)   return `/category/${banner.linkedCategory}`;
    if (banner.bannerType === 'collection' && banner.linkedCollection)  return `/collection/${banner.linkedCollection}`;
    if (banner.bannerType === 'brand'      && banner.linkedBrand)       return `/search?brand=${encodeURIComponent(banner.linkedBrand)}`;
    return '/';
  })();

  return (
    <section className="offer-banner">
      <div className="offer-banner__inner container">
        <Link to={href} className="offer-banner__card" aria-label={banner.title}>
          <img
            src={getImageUrl(banner.imageUrl)}
            alt={banner.title}
            className="offer-banner__img"
            loading="lazy"
          />
          <div className="offer-banner__overlay">
            <div className="offer-banner__content">
              <p className="offer-banner__eyebrow">Special Offer</p>
              <h2 className="offer-banner__title">{banner.title}</h2>
              {banner.description && (
                <p className="offer-banner__desc">{banner.description}</p>
              )}
              <span className="offer-banner__cta">Shop Now &nbsp;→</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default memo(OfferBannerSection);
