import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { cachedGet } from '../../services/api';
import './HeroCarousel.scss';

const FALLBACK_SLIDES = [
  { _id: 'f1', imageUrl: '/banner/banner1.webp', redirectUrl: '/category/rings' },
  { _id: 'f2', imageUrl: '/banner/banner2.webp', redirectUrl: '/category/necklaces' },
  { _id: 'f3', imageUrl: '/banner/banner3.webp', redirectUrl: '/category/sets' },
];

function getRedirectUrl(banner) {
  if (banner.bannerType === 'category'   && banner.linkedCategory)   return `/category/${banner.linkedCategory}`;
  if (banner.bannerType === 'collection' && banner.linkedCollection)  return `/search?collection=${encodeURIComponent(banner.linkedCollection)}`;
  if (banner.bannerType === 'brand'      && banner.linkedBrand)       return `/search?brand=${encodeURIComponent(banner.linkedBrand)}`;
  return banner.redirectUrl || '/';
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    // Banners change infrequently — cache for 5 minutes
    cachedGet('/banners', { ttl: 300_000 })
      .then(res => {
        const data = res.data.data;
        if (data && data.length > 0) setSlides(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="hero-section">
      <div className="hero">
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true, el: '.hero-pagination' }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          autoHeight
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={slide._id}>
              <Link
                to={getRedirectUrl(slide)}
                className="hero__slide"
                aria-label={slide.title || 'View collection'}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.title || 'Banner'}
                  className="hero__bg"
                  // First slide: load immediately with high priority (LCP image)
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="hero-pagination" />
    </section>
  );
}
