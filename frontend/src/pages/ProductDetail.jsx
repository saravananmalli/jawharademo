import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FaHeart, FaCheckCircle, FaStar, FaStarHalfAlt, FaRegStar,
  FaTruck, FaUndoAlt, FaShieldAlt, FaChevronDown, FaChevronUp,
  FaShippingFast, FaAward, FaCreditCard, FaHeadset,
  FaGem, FaInfoCircle, FaVideo,
} from 'react-icons/fa';
import { FiHeart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useDeliverySettings } from '../context/DeliverySettingsContext';
import { QuantityControl } from '../components/Common';
import ReviewCard from '../components/Common/ReviewCard';
import ProductCard from '../components/Products/ProductCard';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { DirhamSymbol } from 'dirham/react';
import './ProductDetail.scss';


const TRUST_ITEMS = [
  {
    image: '/icons/certificate.png',
    title: '100% Certified',
    desc: 'All diamonds independently certified',
  },
  {
    image: '/icons/shipping.png',
    title: 'Free Shipping',
    desc: 'On all orders above د.إ 500',
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


function StarsDisplay({ rating, size = 'md' }) {
  return (
    <span className={`pd-stars pd-stars--${size}`}>
      {[1, 2, 3, 4, 5].map(star => {
        if (rating >= star) return <FaStar key={star} />;
        if (rating >= star - 0.5) return <FaStarHalfAlt key={star} />;
        return <FaRegStar key={star} />;
      })}
    </span>
  );
}

function AccordionSection({ id, domId, title, isOpen, onToggle, children }) {
  return (
    <div id={domId} className={`pd-accordion ${isOpen ? 'pd-accordion--open' : ''}`}>
      <button
        className="pd-accordion__header"
        onClick={() => onToggle(isOpen ? null : id)}
        aria-expanded={isOpen}
      >
        <span className="pd-accordion__title">{title}</span>
        <span className="pd-accordion__icon">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>
      <div className="pd-accordion__body">
        <div className="pd-accordion__content">{children}</div>
      </div>
    </div>
  );
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { isDeliveryAvailable, deliverySettings } = useDeliverySettings();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [productReviews, setProductReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('description');
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [transitioning, setTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [descOverflows, setDescOverflows] = useState(false);
  const imgContainerRef = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setAdded(false);
    setSelectedVariants({});

    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`),
    ]).then(([prodRes, revRes]) => {
      const found = prodRes.data.data;
      setProduct(found || null);
      setProductReviews(revRes.data.data || []);

      if (found) {
        api.get(`/products?category=${encodeURIComponent(found.category)}&limit=7`)
          .then(({ data }) => {
            const related = (data.data || []).filter(p => p._id !== id).slice(0, 6);
            setRelatedProducts(related);
          });

        try {
          const slim = {
            _id: found._id, name: found.name, price: found.price,
            originalPrice: found.originalPrice, discount: found.discount,
            images: found.images, rating: found.rating, reviewCount: found.reviewCount,
            arrivesBy: found.arrivesBy, category: found.category, inStock: found.inStock,
            badge: found.badge,
          };
          const stored = JSON.parse(localStorage.getItem('jw_viewed') || '[]');
          const updated = [slim, ...stored.filter(p => p._id !== id)].slice(0, 8);
          localStorage.setItem('jw_viewed', JSON.stringify(updated));
          setRecentlyViewed(updated.filter(p => p._id !== id).slice(0, 4));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const end = Date.now() + 2 * 86400000 + 9 * 3600000 + 22 * 60000 + 2000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [product]);

  const changeImage = useCallback((idx) => {
    if (idx === selectedImage) return;
    setTransitioning(true);
    setTimeout(() => {
      setSelectedImage(idx);
      setTransitioning(false);
    }, 150);
  }, [selectedImage]);

  const handleMouseMove = useCallback((e) => {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin(`${x}% ${y}%`);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }, [addItem, product, quantity]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  }, [addItem, product, quantity, navigate, isAuthenticated]);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 1);
    }
  }, [product]);

  const handleReadMore = useCallback(() => {
    setActiveAccordion('description');
    setTimeout(() => {
      document.getElementById('pd-desc-accordion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  if (!product) {
    return (
      <div className="pd-loading">
        <div className="pd-loading__inner container">
          <div className="pd-loading__spinner" />
          <p>Loading product details…</p>
        </div>
      </div>
    );
  }

  const wishlisted = isWishlisted(product._id);
  const images = product.images?.length
    ? product.images.map(getImageUrl)
    : [`https://placehold.co/800x800/F5EFE6/C4A960?text=${encodeURIComponent(product.name)}`];

  const ringSizes = product.sizes ?? [];
  const materials = [product.metal].filter(Boolean);
  const stones = product.stone && product.stone !== 'None' ? [product.stone] : [];
  const categorySlug = product.category.toLowerCase().replace(/[\s&]+/g, '-');

  const r = product.rating;
  const five  = r >= 4.8 ? 72 : r >= 4.5 ? 60 : 50;
  const four  = r >= 4.8 ? 18 : r >= 4.5 ? 25 : 30;
  const three = r >= 4.5 ? 6  : 11;
  const two   = 3;
  const one   = Math.max(1, 100 - five - four - three - two);
  const ratingBreakdown = [
    { star: 5, percent: five },
    { star: 4, percent: four },
    { star: 3, percent: three },
    { star: 2, percent: two },
    { star: 1, percent: one },
  ];

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) changeImage(Math.min(selectedImage + 1, images.length - 1));
      else changeImage(Math.max(selectedImage - 1, 0));
    }
    setTouchStartX(null);
  };

  const displayedReviews = productReviews.map(rv => ({
    id: rv._id,
    name: rv.userName,
    location: rv.location || null,
    avatar: null,
    verified: rv.verified,
    rating: rv.rating,
    text: rv.text,
    timeAgo: new Date(rv.createdAt).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' }),
  }));

  return (
    <main className="pd">
      <div className="container">

        {/* ── Breadcrumb ── */}
        <nav className="pd__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd__breadcrumb-sep">/</span>
          <Link to={`/category/${categorySlug}`}>{product.category}</Link>
          <span className="pd__breadcrumb-sep">/</span>
          <span className="pd__breadcrumb-current">{product.name}</span>
        </nav>

        {/* ── Main Two-Column Layout ── */}
        <div className="pd__layout">

          {/* Gallery Column */}
          <div className="pd__gallery">
            {/* Vertical thumbnail strip — left side */}
            <div className="pd__thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`pd__thumb ${i === selectedImage ? 'active' : ''}`}
                  onClick={() => changeImage(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === selectedImage}
                >
                  <img src={img} alt={`Product view ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="pd__main-img-wrap">
              <div
                ref={imgContainerRef}
                className={[
                  'pd__main-img',
                  isZooming ? 'pd__main-img--zoom' : '',
                  transitioning ? 'pd__main-img--fade' : '',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  style={isZooming ? { transformOrigin: zoomOrigin, transform: 'scale(2.2)' } : undefined}
                />
                {product.badge && (
                  <span className="pd__img-badge pd__img-badge--seller">{product.badge}</span>
                )}
                {product.discount > 0 && (
                  <span className="pd__img-badge pd__img-badge--discount">-{product.discount}%</span>
                )}
                {!product.inStock && (
                  <span className="pd__img-badge pd__img-badge--oos">Out of Stock</span>
                )}
              </div>

              {/* Mobile arrow navigation */}
              {images.length > 1 && (
                <>
                  <button
                    className="pd__img-nav pd__img-nav--prev"
                    onClick={() => changeImage(Math.max(selectedImage - 1, 0))}
                    disabled={selectedImage === 0}
                    aria-label="Previous image"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="pd__img-nav pd__img-nav--next"
                    onClick={() => changeImage(Math.min(selectedImage + 1, images.length - 1))}
                    disabled={selectedImage === images.length - 1}
                    aria-label="Next image"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}

              {/* Mobile dot indicators */}
              {images.length > 1 && (
                <div className="pd__dots" aria-hidden="true">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`pd__dot ${i === selectedImage ? 'active' : ''}`}
                      onClick={() => changeImage(i)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Info Column */}
          <div className="pd__info">
            {/* Brand */}
            {product.brand && (
              <p className="pd__brand">{product.brand}</p>
            )}

            {/* Title */}
            <h1 className="pd__title">{product.name}</h1>

            {/* Rating row */}
            <div className="pd__rating-row">
              <StarsDisplay rating={product.rating} size="md" />
              <a href="#pd-reviews" className="pd__review-count">
                {product.reviewCount > 0
                  ? `(${product.reviewCount} customer review${product.reviewCount !== 1 ? 's' : ''})`
                  : '(No reviews yet)'}
              </a>
            </div>

            {/* Price */}
            <div className="pd__price-block">
              <span className="pd__price-current"><DirhamSymbol size="0.75em" weight="bold" /> {formatPrice(product.price * quantity)}</span>
              {product.originalPrice && (
                <span className="pd__price-original"><DirhamSymbol size="0.75em" weight="regular" /> {formatPrice(product.originalPrice * quantity)}</span>
              )}
              {product.discount > 0 && (
                <span className="pd__price-badge">{product.discount}%</span>
              )}
              {quantity > 1 && (
                <span className="pd__price-per-unit"><DirhamSymbol size="0.7em" /> {formatPrice(product.price)} each</span>
              )}
            </div>

            {/* Design Code */}
            {product.designCode && (
              <div className="pd__design-code">
                <strong>Design Code:</strong> {product.designCode}
              </div>
            )}

            {/* Short Description */}
            <p ref={descRef} className="pd__short-desc">{stripHtml(product.description)}</p>
            {descOverflows && (
              <button className="pd__read-more" onClick={handleReadMore}>
                Read more
              </button>
            )}

            <div className="pd__divider" />

            {/* Spec + Delivery/Timer — 2-col layout */}
            <div className="pd__spec-timer-row">

              {/* Left: Specification Card */}
              {(product.metal || product.stone === 'Diamond') && (
                <div className="pd__spec-card">
                  <div className={`pd__spec-card-grid${product.stone === 'Diamond' ? ' pd__spec-card-grid--two' : ''}`}>
                    {product.metal && (
                      <div className="pd__spec-card-section">
                        <div className="pd__spec-card-header">
                          <span className="pd__spec-card-name">{product.metal}</span>
                        </div>
                        <ul className="pd__spec-card-list">
                          {product.metalKt && <li>{product.metalKt}</li>}
                          <li>{product.metal}</li>
                          {product.weight && <li>{product.weight} g <span>(Net wt)</span></li>}
                        </ul>
                      </div>
                    )}
                    {product.stone === 'Diamond' && (
                      <div className="pd__spec-card-section pd__spec-card-section--divided">
                        <div className="pd__spec-card-header">
                          <span className="pd__spec-card-name">Diamond</span>
                        </div>
                        <ul className="pd__spec-card-list">
                          {product.diamondClarity && <li>{product.diamondClarity}</li>}
                          {product.diamondCt && <li>{product.diamondCt} ct <span>(Total wt)</span></li>}
                          {product.diamondColor && <li>Color: {product.diamondColor}</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right: Delivery + Countdown */}
              <div className="pd__timer-col">
                {product.inStock && (product.arrivesBy || product.deliveryDate) && (
                  <div className="pd__delivery-badge">
                    <FaTruck className="pd__delivery-icon" />
                    <span className="pd__delivery-text">
                      <><span>FREE DELIVERY</span> <strong>{product.arrivesBy || product.deliveryDate}</strong></>
                    </span>
                  </div>
                )}
                <div className="pd__countdown">
                  <p className="pd__countdown-label">Hurry Up! Deals End In:</p>
                  <div className="pd__countdown-boxes">
                    {[
                      { value: timeLeft.days, unit: 'day' },
                      { value: timeLeft.hours, unit: 'hour' },
                      { value: timeLeft.minutes, unit: 'min' },
                      { value: timeLeft.seconds, unit: 'sec' },
                    ].map(({ value, unit }, i) => (
                      <Fragment key={unit}>
                        {i > 0 && <span className="pd__countdown-sep">:</span>}
                        <div className="pd__countdown-box">
                          <span className="pd__countdown-num">{String(value).padStart(2, '0')}</span>
                          <span className="pd__countdown-unit">{unit}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ring size selector */}
            {ringSizes.length > 0 && (
              <div className="pd__variant-group">
                <div className="pd__variant-label">
                  Ring Size:
                  {selectedVariants.size
                    ? <strong> {selectedVariants.size}</strong>
                    : <span className="pd__variant-hint"> Please select a size</span>
                  }
                </div>
                <div className="pd__variant-options">
                  {ringSizes.map(size => (
                    <button
                      key={size}
                      className={`pd__variant-btn pd__variant-btn--size ${selectedVariants.size === size ? 'active' : ''}`}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, size }))}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            

            {/* Feature Icons */}
            <div className="pd__features">
              {TRUST_ITEMS.map(({ image, title, desc }) => (
                <div key={title} className="pd__feature-item">
                  <img src={image} alt={title} className="pd__feature-icon" />
                  <div className="pd__feature-text">
                    <span className="pd__feature-title">{title}</span>
                    <span className="pd__feature-sub">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

             {/* Quantity + CTA Row */}
            <div className="pd__qty-cta-row">
              <QuantityControl value={quantity} onChange={setQuantity} />
              <button
                className={`pd__cta-btn pd__cta-btn--bag ${added ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={!product.inStock || !isDeliveryAvailable}
                title={!isDeliveryAvailable ? deliverySettings.restrictionMessage : undefined}
              >
                {!product.inStock ? 'Out of Stock' : added ? '✓ Added' : 'ADD TO BAG'}
              </button>
              <button
                className="pd__cta-btn pd__cta-btn--buy-now"
                onClick={handleBuyNow}
                disabled={!product.inStock || !isDeliveryAvailable}
                title={!isDeliveryAvailable ? deliverySettings.restrictionMessage : undefined}
              >
                BUY NOW
              </button>
            </div>
            {!isDeliveryAvailable && (
              <p className="pd__delivery-restriction">
                <FaTruck style={{ marginRight: 6, flexShrink: 0 }} />
                {deliverySettings.restrictionMessage}
              </p>
            )}

            <div className="pd__divider" />

           

            {/* Bottom Action Links */}
            <div className="pd__action-links">
              <button
                className={`pd__action-link ${wishlisted ? 'active' : ''}`}
                onClick={() => toggle(product)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {wishlisted ? <FaHeart /> : <img src="/icons/Heart.png" alt="wishlist" className="pd__action-icon" />}
                <span>Wishlist</span>
              </button>
              <button className="pd__action-link">
                <img src="/icons/size-guid.png" alt="sizeguide" className="pd__action-icon" />
                <span>Sizeguide</span>
              </button>
              <button className="pd__action-link">
                <img src="/icons/question.png" alt="question" className="pd__action-icon" />
                <span>Question</span>
              </button>
              <button className="pd__action-link">
                <img src="/icons/share.png" alt="share" className="pd__action-icon" />
                <span>Share</span>
              </button>
            </div>

            {/* Video Call Card */}
            <div className="pd__video-call-card">
              <div className="pd__video-call-visual">
                <FaVideo className="pd__video-call-visual-icon" />
              </div>
              <div className="pd__video-call-body">
                <h4 className="pd__video-call-title">Live Video Call</h4>
                <p className="pd__video-call-desc">
                  Join a live video call with our consultants to see your favourite designs up close!
                </p>
                <button className="pd__video-call-btn">Schedule a Video Call</button>
              </div>
            </div>

            
          </div>
        </div>

        {/* ── Accordion Sections ── */}
        <div className="pd__accordions">
          <AccordionSection
            id="description"
            domId="pd-desc-accordion"
            title="Description"
            isOpen={activeAccordion === 'description'}
            onToggle={setActiveAccordion}
          >
            <p className="pd__desc-text">{stripHtml(product.description)}</p>
            <p className="pd__desc-text">
              Each piece from the <strong>{product.collection}</strong> collection is handcrafted
              by master artisans using the finest certified materials. Designed to complement every
              occasion — from everyday elegance to grand celebrations.
            </p>
            {product.tags?.length > 0 && (
              <div className="pd__tags">
                {product.tags.map(tag => (
                  <span key={tag} className="pd__tag">{tag}</span>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            id="specifications"
            title="Product Specifications"
            isOpen={activeAccordion === 'specifications'}
            onToggle={setActiveAccordion}
          >
            <div className="pd__specs">
              <div className="pd__spec-row">
                <span className="pd__spec-key">Brand</span>
                <span className="pd__spec-val">{product.brand || '—'}</span>
              </div>
              <div className="pd__spec-row">
                <span className="pd__spec-key">Metal</span>
                <span className="pd__spec-val">{product.metal} {product.metalKt}</span>
              </div>
              {product.stone && product.stone !== 'None' && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">Stone</span>
                  <span className="pd__spec-val">{product.stone}</span>
                </div>
              )}
              {product.stone === 'Diamond' && product.diamondClarity && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">Diamond Clarity</span>
                  <span className="pd__spec-val">{product.diamondClarity}</span>
                </div>
              )}
              {product.stone === 'Diamond' && product.diamondColor && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">Diamond Color</span>
                  <span className="pd__spec-val">{product.diamondColor}</span>
                </div>
              )}
              {product.stone === 'Diamond' && product.diamondCt && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">Diamond Carat</span>
                  <span className="pd__spec-val">{product.diamondCt} ct.</span>
                </div>
              )}
              {product.weight && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">Weight</span>
                  <span className="pd__spec-val">{product.weight} g</span>
                </div>
              )}
              <div className="pd__spec-row">
                <span className="pd__spec-key">Collection</span>
                <span className="pd__spec-val">{product.collection}</span>
              </div>
              <div className="pd__spec-row">
                <span className="pd__spec-key">Category</span>
                <span className="pd__spec-val">{product.category}</span>
              </div>
              {product.forWho?.length > 0 && (
                <div className="pd__spec-row">
                  <span className="pd__spec-key">For</span>
                  <span className="pd__spec-val" style={{ textTransform: 'capitalize' }}>
                    {product.forWho.join(', ')}
                  </span>
                </div>
              )}
              <div className="pd__spec-row">
                <span className="pd__spec-key">Certified</span>
                <span className="pd__spec-val">
                  {product.certified ? 'Yes — Hallmark Certified' : 'No'}
                </span>
              </div>
              <div className="pd__spec-row">
                <span className="pd__spec-key">SKU</span>
                <span className="pd__spec-val">{product._id.toUpperCase()}</span>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="shipping"
            title="Shipping & Delivery"
            isOpen={activeAccordion === 'shipping'}
            onToggle={setActiveAccordion}
          >
            <ul className="pd__info-list">
              <li>Free standard shipping on all orders across UAE</li>
              <li>Express delivery available at checkout for eligible locations</li>
              <li>Orders placed before 2:00 PM are dispatched the same day</li>
              <li>Secure and discreet packaging with live tracking via SMS/email</li>
              {product.arrivesBy && (
                <li>This item is estimated to arrive by <strong>{product.arrivesBy}</strong></li>
              )}
              <li>Fulfilled by: <strong>{product.fulfilledBy || 'Jawhara Jewellery'}</strong></li>
            </ul>
          </AccordionSection>

          <AccordionSection
            id="returns"
            title="Returns & Exchange Policy"
            isOpen={activeAccordion === 'returns'}
            onToggle={setActiveAccordion}
          >
            <ul className="pd__info-list">
              <li>30-day hassle-free return policy from the date of delivery</li>
              <li>Items must be unused, unworn and in original packaging with tags attached</li>
              <li>Free returns for defective or incorrectly delivered items</li>
              <li>Exchange available for size issues — contact support within 7 days</li>
              <li>Refunds are processed within 5–7 business days after item receipt</li>
              <li>Customized or engraved items are not eligible for returns</li>
            </ul>
          </AccordionSection>
        </div>

        {/* ── Customer Reviews ── */}
        <section className="pd__reviews" id="pd-reviews">
          <h2 className="pd__section-title">Customer Reviews</h2>

          {product.reviewCount > 0 && (
            <div className="pd__reviews-summary">
              <div className="pd__reviews-avg">
                <span className="pd__reviews-big">{product.rating}</span>
                <StarsDisplay rating={product.rating} size="lg" />
                <span className="pd__reviews-count">Based on {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="pd__rating-bars">
                {ratingBreakdown.map(({ star, percent }) => (
                  <div key={star} className="pd__rating-bar-row">
                    <span className="pd__rating-bar-label">{star} star</span>
                    <div className="pd__rating-bar-track">
                      <div className="pd__rating-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="pd__rating-bar-pct">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayedReviews.length > 0 ? (
            <div className="pd__reviews-grid">
              {displayedReviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="pd__no-reviews">No reviews yet. Be the first to review this product!</p>
          )}
        </section>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <section className="pd__related">
            <div className="pd__section-header">
              <h2 className="pd__section-title">You May Also Like</h2>
              <Link to={`/category/${categorySlug}`} className="pd__section-link">View All</Link>
            </div>
            <div className="pd__products-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <section className="pd__recent">
            <div className="pd__section-header">
              <h2 className="pd__section-title">Recently Viewed</h2>
            </div>
            <div className="pd__products-grid">
              {recentlyViewed.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Mobile Sticky Bar ── */}
      <div className="pd__sticky">
        <div className="pd__sticky-price">
          <span className="pd__sticky-current"><DirhamSymbol size="0.75em" weight="bold" /> {formatPrice(product.price * quantity)}</span>
          {product.discount > 0 && (
            <span className="pd__sticky-off">{product.discount}% OFF</span>
          )}
        </div>
        <div className="pd__sticky-actions">
          <button
            className={`pd__sticky-cart ${added ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            {added ? 'Added!' : 'Add to Bag'}
          </button>
          <button
            className="pd__sticky-buy"
            onClick={handleBuyNow}
            disabled={!product.inStock}
          >
            Buy Now
          </button>
        </div>
      </div>
    </main>
  );
}
