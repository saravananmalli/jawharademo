import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from './ProductCard';
import './ProductRow.scss';

function ProductRow({ title, description, products = [], viewAllLink = '/' }) {
  if (!products.length) return null;

  return (
    <section className="product-row">
      <div className="product-row__header">
        <div> 
          <h2 className="product-row__title">{title}</h2>
          <p className='product-row__sub'>{description}</p>
        </div>

        
        <Link to={viewAllLink} className="product-row__view-all">
          Check All → 
        </Link>
      </div>

      {/* Mobile: 2-column grid, no slider */}
      <div className="product-row__mobile-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Tablet+: Swiper slider */}
      <Swiper
        modules={[Navigation]}
        navigation
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 20 },
          1280: { slidesPerView: 5, spaceBetween: 20 },
        }}
        className="product-row__swiper"
      >
        {products.map(product => (
          <SwiperSlide key={product._id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default memo(ProductRow);
