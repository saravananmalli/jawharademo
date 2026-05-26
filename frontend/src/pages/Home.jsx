import { useState, useEffect, memo } from "react";
import HeroCarousel from "../components/Hero/HeroCarousel";
import TrustSection from "../components/Sections/TrustSection";
import OccasionOfferSection from "../components/Sections/OccasionOfferSection";
import OfferBannerSection from "../components/Sections/OfferBannerSection";
import ProductRow from "../components/Products/ProductRow";
import CollectionsSection from "../components/Sections/CollectionsSection";
import ReviewsSection from "../components/Sections/ReviewsSection";
import PromoSection from "../components/Sections/PromoSection";
import LazySection from "../components/Common/LazySection";
import { cachedGet } from "../services/api";
import "./Home.scss";

function Home() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fetch new arrivals; top-rated products are loaded inside OccasionOfferSection
    cachedGet('/products', { params: { sort: 'newest', limit: 10 } })
      .then((res) => {
        setNewArrivals(res.data.data || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <main className="home">
      {/* ── Above-fold: render immediately ── */}
      <HeroCarousel />
      <OfferBannerSection />
      <OccasionOfferSection />
      <PromoSection />
      <TrustSection />

      {/* ── Below-fold: defer until near viewport ── */}
      <LazySection minHeight={400}>
        <div className="home__rows container">
          <ProductRow
            title="New Arrivals"
            description="Discover the latest additions to our collection, featuring the freshest styles and hottest trends in jewelry."
            products={newArrivals}
            viewAllLink="/collection/new-arrivals"
          />
        </div>
      </LazySection>

      <LazySection minHeight={350}>
        <ReviewsSection />
      </LazySection>

      <LazySection minHeight={320}>
        <CollectionsSection />
      </LazySection>
    </main>
  );
}

export default memo(Home);
