import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './CollectionsSection.scss';

const COLLECTIONS = [
  {
    id: 1,
    name: 'Danah Set',
    desc: 'Delicate details and feminine designs crafted from 18K gold and refined touches of pearl',
    image: '/images/danah-set.png',
    imageWebP: '/images/danah-set.webp',
    link: '/collections/danah-set',
  },
  {
    id: 2,
    name: 'Dana Tassel',
    desc: 'Unique harmony of natural elements and refined elegance with a necklace and earrings set',
    image: '/images/danah-tassel.png',
    imageWebP: '/images/danah-tassel.webp',
    link: '/collections/dana-tassel',
  },
  {
    id: 3,
    name: 'KRIA',
    desc: 'Discover KRIA diamond sets, adorned with globally certified natural diamonds',
    image: '/images/kria.png',
    imageWebP: '/images/kria.webp',
    link: '/collections/kria',
  },
  {
    id: 4,
    name: 'Torresan',
    desc: 'The Torresan Diamond Collection — certified natural diamonds that blend art and craftsmanship',
    image: '/images/torresan.png',
    imageWebP: '/images/torresan.webp',
    link: '/collections/torresan',
  },
  {
    id: 5,
    name: 'Festive',
    desc: '22K diamond necklace craftsmanship celebrating every special occasion',
    image: '/images/festive.png',
    imageWebP: '/images/festive.webp',
    link: '/collections/festive',
  },
];

function CollectionsSection() {
  const sliderRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows]);

  const scroll = (dir) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector('.collection-card');
    const step = card ? card.offsetWidth + 20 : 280;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className="collections-section">
      <div className="container">
        <div className="collections-section__head">
          <h2 className="collections-section__title">Jawhara Collections</h2>
          <p className="collections-section__sub">Discover why customers love our products</p>
        </div>

        <div className="collections-slider-wrap">
          <button
            className="collections-nav__btn collections-nav__btn--prev"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label="Previous collections"
          >
            <FiChevronLeft />
          </button>

          <div className="collections-slider" ref={sliderRef}>
            {COLLECTIONS.map(col => (
              <Link key={col.id} to={col.link} className="collection-card">
                <div className="collection-card__img-wrap">
                  <picture>
                    <source srcSet={col.imageWebP} type="image/webp" />
                    <img
                      src={col.image}
                      alt={col.name}
                      loading="lazy"
                      decoding="async"
                      width="280"
                      height="320"
                    />
                  </picture>
                </div>
                <h3 className="collection-card__name">{col.name}</h3>
                <p className="collection-card__desc">{col.desc}</p>
              </Link>
            ))}
          </div>

          <button
            className="collections-nav__btn collections-nav__btn--next"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label="Next collections"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}

export default memo(CollectionsSection);
