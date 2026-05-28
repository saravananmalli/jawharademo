import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import ProductCard from "../Products/ProductCard";
import { cachedGet } from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";
import "./OccasionOfferSection.scss";

// ── Countdown helpers ──────────────────────────────────────────────────────────
function getTimeLeft(target) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}
function pad(n) {
  return String(n).padStart(2, "0");
}

function OccasionOfferSection() {
  const [offer, setOffer] = useState(null);
  const [products, setProducts] = useState([]);
  const [time, setTime] = useState(null);
  const [expired, setExpired] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Fetch active offer ───────────────────────────────────────────────────────
  useEffect(() => {
    cachedGet("/offers/active", { ttl: 60_000 })
      .then(({ data }) => {
        const o = data.data;
        if (!o) return;
        setOffer(o);
        setProducts(o.products || []);
        if (o.endDate) setTime(getTimeLeft(new Date(o.endDate)));
      })
      .catch(() => {});
  }, []);

  // ── Live countdown tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!offer?.endDate || !offer.showCountdown) return;
    const target = new Date(offer.endDate).getTime();
    const id = setInterval(() => {
      const tl = getTimeLeft(target);
      setTime(tl);
      if (
        tl.days === 0 &&
        tl.hours === 0 &&
        tl.minutes === 0 &&
        tl.seconds === 0
      ) {
        setExpired(true);
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [offer]);

  if (!offer && products.length === 0) return null;

  const title = offer?.title || "Limited-Time Jewellery Offers";
  const subtitle = offer?.subtitle || "Sale up to 50% off on selected items.";
  const viewAllLink = "/offer/active";
  const showCountdown =
    offer?.showCountdown && offer?.endDate && !expired && time;
  const hasBanner = !!(offer?.bannerImage && offer?.bannerActive);

  const units = showCountdown
    ? [
        { value: pad(time.days), label: "day" },
        { value: pad(time.hours), label: "hour" },
        { value: pad(time.minutes), label: "min" },
        { value: pad(time.seconds), label: "sec" },
      ]
    : [];

  return (
    <section className="occ-offer">
      <div
        className={`occ-offer__inner container${hasBanner ? "" : " occ-offer__inner--full"}`}
      >
        {/* ── Left: Campaign banner card ──────────────────────────────────── */}
        {hasBanner && (
          <div className="occ-left">
            <div className="occ-left__header">
              <div>
                <h2 className="occ-left__title">{offer.bannerTitle}</h2>
                <p className="occ-left__sub">{offer.bannerDescription}</p>
              </div>
              <Link to={offer.bannerCtaLink || "/"} className="occ-check-all">
                Check All &nbsp;→
              </Link>
            </div>

            <Link
              to={offer.bannerCtaLink || "/"}
              className="occ-left__card"
              aria-label={offer.bannerTitle}
            >
              <img
                src={getImageUrl(offer.bannerImage)}
                alt={offer.bannerTitle}
                loading="lazy"
              />
              <div className="occ-left__overlay">
                <h3 className="occ-left__overlay-title">{offer.bannerTitle}</h3>
                <p className="occ-left__overlay-sub">
                  {offer.bannerDescription}
                </p>
                <span className="occ-left__cta">
                  {offer.bannerCtaText || "See More Product"} &nbsp;→
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* ── Right: Offer header + product slider ────────────────────────── */}
        <div className="occ-right">
          {/* Header: title + timer inline (left), "Check All →" (right) */}
          <div className="occ-right__header">
            <div className="occ-right__title-row">
              {/* Title and timer sit side-by-side */}
              <div className="occ-right__title-wrap">
                <div>
                  <h2 className="occ-right__title">{title}</h2>
                  {subtitle && <p className="occ-right__sub">{subtitle}</p>}
                </div>

                {showCountdown && (
                  <div className="occ-timer">
                    {units.map((unit, i) => (
                      <div key={unit.label} className="occ-timer__group">
                        <div className="occ-timer__box">
                          <span className="occ-timer__num">{unit.value}</span>
                          <span className="occ-timer__label">{unit.label}</span>
                        </div>
                        {i < 3 && <span className="occ-timer__sep">:</span>}
                      </div>
                    ))}
                  </div>
                )}
                {expired && (
                  <p className="occ-right__expired">This offer has ended.</p>
                )}
              </div>

              <Link to={viewAllLink} className="occ-check-all">
                Check All &nbsp;→
              </Link>
            </div>
          </div>

          {/* Mobile: 2-col grid showing all products */}
          <div className="occ-right__mobile-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* Desktop: Swiper with built-in Navigation arrows */}
          <div className="occ-right__swiper-wrap">
            <Swiper
              modules={[Navigation]}
              navigation
              slidesPerView={2}
              spaceBetween={12}
              breakpoints={{
                769: { slidesPerView: 2, spaceBetween: 16 },
                1024: { slidesPerView: 3, spaceBetween: 16 },
                1280: { slidesPerView: 4, spaceBetween: 16 },
              }}
            >
              {products.map((p) => (
                <SwiperSlide key={p._id}>
                  <ProductCard product={p} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(OccasionOfferSection);
