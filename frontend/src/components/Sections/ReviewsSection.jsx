import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ReviewCard from '../Common/ReviewCard';
import { cachedGet } from '../../services/api';
import './ReviewsSection.scss';

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cachedGet('/reviews/latest', { ttl: 120_000 })
      .then(res => setReviews(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !reviews.length) return null;

  return (
    <section className="reviews-section">
      <div className="reviews-section__header container">
        <h2 className="reviews-section__title">What Our Customers Say</h2>
        <Link to="/reviews" className="reviews-section__view-all">
          Check All →
        </Link>
      </div>

      {/* Mobile: 1-column list */}
      <div className="reviews-section__mobile-list container">
        {reviews.slice(0, 4).map(review => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>

      {/* Tablet+: Swiper slider */}
      <div className="reviews-section__slider container">
        <Swiper
          modules={[Navigation]}
          navigation
          slidesPerView={1}
          spaceBetween={16}
          breakpoints={{
            600:  { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="reviews-section__swiper"
        >
          {reviews.map(review => (
            <SwiperSlide key={review._id}>
              <ReviewCard review={review} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

export default memo(ReviewsSection);
