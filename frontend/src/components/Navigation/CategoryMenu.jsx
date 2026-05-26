import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiChevronDown } from "react-icons/fi";
import { DirhamSymbol } from "dirham/react";
import { useLanguage } from "../../context/LanguageContext";
import "./CategoryMenu.scss";

// Price range objects used by all "By Price" mega-menu columns.
// Links navigate to ?priceMin=X&priceMax=Y so filtering is server-side.
const D = <DirhamSymbol size="0.82em" weight="regular" />;
const BY_PRICE_RANGES = [
  { node: <>Under {D} 1,000</>,        min: 0,     max: 1000 },
  { node: <>{D} 1,000 – {D} 2,500</>,  min: 1000,  max: 2500 },
  { node: <>{D} 2,500 – {D} 5,000</>,  min: 2500,  max: 5000 },
  { node: <>{D} 5,000 – {D} 10,000</>, min: 5000,  max: 10000 },
  { node: <>Above {D} 10,000</>,        min: 10001  },
];

// ── "All Category" dropdown links ─────────────────────────────────────
// Gold, Diamond, Pearl use /collection/all?metal= / ?stone= so the backend
// filters by the metal/stone field (not the category field).
const ALL_CATEGORY_LINKS = [
  { label: "All Products",    path: "/category/all",                  iconImg: "/icons/menu/all-products.png",    iconBg: "#E8E8E8" },
  { label: "Gold",            path: "/collection/all?metal=gold",     iconImg: "/icons/menu/rings.png",           iconBg: "#E8E8E8" },
  { label: "Diamond",         path: "/collection/all?stone=diamond",  iconImg: "/icons/menu/diamond.png",         iconBg: "#E8E8E8" },
  { label: "Pearl",           path: "/collection/all?stone=pearl",    iconImg: "/icons/menu/pearl.png",           iconBg: "#E8E8E8" },
  { label: "Necklaces",       path: "/category/necklaces",            iconImg: "/icons/menu/necklace.png",        iconBg: "#E8E8E8" },
  { label: "Pendants",        path: "/category/pendants",             iconImg: "/icons/menu/necklace.png",        iconBg: "#E8E8E8" },
  { label: "Bracelet",        path: "/category/bracelets",            iconImg: "/icons/menu/bracelet.png",        iconBg: "#E8E8E8" },
  { label: "Earrings",        path: "/category/earrings",             iconImg: "/icons/menu/earrings.png",        iconBg: "#E8E8E8" },
  { label: "Kids Jewellery",  path: "/category/kids",                 iconImg: "/icons/menu/kids-jewellery.png",  iconBg: "#E8E8E8" },
  { label: "Wedding Ring",    path: "/category/wedding",              iconImg: "/icons/menu/wedding-rings.png",   iconBg: "#E8E8E8" },
];

// ── Main nav items with full-width mega menus ─────────────────────────
const NAV_CATEGORIES = [
  {
    id: "rings",
    label: "Rings",
    path: "/category/rings",
    sections: {
      Featured:          ["Solitaire Rings", "Halo Rings", "Eternity Bands", "Statement Rings", "Stackable Rings"],
      "By Style":        ["Classic", "Modern", "Vintage", "Minimalist", "Cocktail", "Bohemian"],
      "By Metal & Stone":["Diamond", "Gold 18K", "Gold 22K", "White Gold", "Rose Gold", "Emerald", "Ruby", "Sapphire"],
      "By Price":        BY_PRICE_RANGES,
    },
    promos: [{ title: "New Season Rings",  desc: "Latest designs just arrived",     link: "/category/rings?filter=new",      img: "/images/ring.png" }],
  },
  {
    id: "earrings",
    label: "Earrings",
    path: "/category/earrings",
    sections: {
      Featured:          ["Diamond Studs", "Gold Hoops", "Drop Earrings", "Chandelier", "Jhumkas"],
      "By Style":        ["Stud", "Hoop", "Drop", "Chandelier", "Jhumka", "Cluster", "Threader"],
      "By Metal & Stone":["Diamond", "Gold", "White Gold", "Ruby", "Emerald", "Sapphire", "Pearl"],
      "By Price":        BY_PRICE_RANGES,
    },
    promos: [{ title: "Stud Earrings",     desc: "Timeless stud collection",        link: "/category/earrings?filter=studs", img: "/images/earring.png" }],
  },
  {
    id: "necklaces",
    label: "Necklaces & Pendants",
    path: "/category/necklaces",
    subs: [
      { label: "All Necklaces & Pendants", path: "/category/necklaces" },
      { label: "Necklaces",                path: "/category/necklaces" },
      { label: "Pendants",                 path: "/category/pendants"  },
    ],
    sections: {
      Featured:          ["Diamond Pendants", "Gold Chains", "Pearl Necklaces", "Layered Sets", "Chokers"],
      "By Style":        ["Classic", "Layered", "Choker", "Long Chain", "Statement", "Minimal"],
      "By Metal & Stone":["Diamond", "Gold 18K", "White Gold", "Rose Gold", "Pearl", "Emerald"],
      "By Price":        BY_PRICE_RANGES,
    },
    promos: [{ title: "Diamond Necklaces", desc: "Certified diamond collection",    link: "/category/necklaces?filter=diamond", img: "/images/necklace.png" }],
  },
  {
    id: "bracelets",
    label: "Bracelets & Bangles",
    path: "/category/bracelets",
    sections: {
      Featured:          ["Tennis Bracelets", "Gold Bangles", "Diamond Bangles", "Charm Bracelets"],
      "By Style":        ["Tennis", "Bangle", "Charm", "Cuff", "Chain", "Beaded", "Stackable"],
      "By Metal & Stone":["Diamond", "Gold 18K", "Gold 22K", "White Gold", "Rose Gold", "Silver"],
      "By Price":        BY_PRICE_RANGES,
    },
    promos: [{ title: "Gold Bangles",      desc: "Traditional & modern bangles",    link: "/category/bracelets?filter=bangles", img: "/images/bracelet.png" }],
  },
];

const SIMPLE_LINKS = [
  { label: "Today's Deals", path: "/collection/today-deals"  },
  { label: "Gifting",       path: "/collection/gifting"      },
  { label: "New Arrivals",  path: "/collection/new-arrivals" },
  { label: "Best Sellers",  path: "/collection/best-seller"  },
  { label: "Trending",      path: "/collection/trending"     },
];

// Maps a "By Metal & Stone" label to a cross-category material URL.
// Returns null for items that don't have a dedicated material page.
function materialToUrl(label) {
  const l = label.toLowerCase();
  // Stones
  if (/^diamond/.test(l))     return '/collection/all?stone=diamond';
  if (/^pearl/.test(l))       return '/collection/all?stone=pearl';
  if (/^emerald/.test(l))     return '/collection/all?stone=emerald';
  if (/^ruby/.test(l))        return '/collection/all?stone=ruby';
  if (/^sapphire/.test(l))    return '/collection/all?stone=sapphire';
  // Metals (order: specific before general)
  if (/^white gold/.test(l))  return '/collection/all?metal=white+gold';
  if (/^rose gold/.test(l))   return '/collection/all?metal=rose+gold';
  if (/^yellow gold/.test(l)) return '/collection/all?metal=yellow+gold';
  if (/^gold\s+18k/.test(l))  return '/collection/all?metal=gold&metalKt=18K';
  if (/^gold\s+22k/.test(l))  return '/collection/all?metal=gold&metalKt=22K';
  if (/^gold/.test(l))        return '/collection/all?metal=gold';
  if (/^silver/.test(l))      return '/collection/all?metal=silver';
  if (/^platinum/.test(l))    return '/collection/all?metal=platinum';
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Hover helpers — delayed close so mouse can travel from trigger → panel
// ─────────────────────────────────────────────────────────────────────
function useDelayedHover(delay = 120) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const enter = () => { clearTimeout(timer.current); setOpen(true); };
  const leave = () => { timer.current = setTimeout(() => setOpen(false), delay); };

  return [open, enter, leave];
}

// ─────────────────────────────────────────────────────────────────────

export default function CategoryMenu() {
  const { t } = useLanguage();

  // "All Category" panel
  const [allCatOpen, allCatEnter, allCatLeave] = useDelayedHover();

  // Mega nav — track which cat.id is open
  const [openMega, setOpenMega] = useState(null);
  const megaTimer = useRef(null);

  const megaEnter = (id) => { clearTimeout(megaTimer.current); setOpenMega(id); };
  const megaLeave = () => { megaTimer.current = setTimeout(() => setOpenMega(null), 120); };

  return (
    <nav className="category-nav">
      <div className="category-nav__inner">

        {/* ── 1. All Category dropdown ── */}
        <div
          className="category-dropdown"
          onMouseEnter={allCatEnter}
          onMouseLeave={allCatLeave}
        >
          <div className={`category-toggle${allCatOpen ? " category-toggle--open" : ""}`}>
            <FiMenu className="toggle-icon" />
            <span className="toggle-label">{t.nav.allCategories}</span>
            <FiChevronDown className="toggle-chevron" />
          </div>

          <ul
            className={`category-panel${allCatOpen ? " category-panel--open" : ""}`}
            onMouseEnter={allCatEnter}
            onMouseLeave={allCatLeave}
          >
            {ALL_CATEGORY_LINKS.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="category-panel__link">
                  <span className="category-panel__icon" style={{ backgroundColor: link.iconBg }}>
                    <img src={link.iconImg} alt={link.label} />
                  </span>
                  <span className="category-panel__label">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <span className="nav-sep" aria-hidden="true" />

        {/* ── 2. Mega nav ── */}
        <nav className="mega-nav">
          {NAV_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`mega-nav__item${openMega === cat.id ? " mega-nav__item--open" : ""}`}
              onMouseEnter={() => megaEnter(cat.id)}
              onMouseLeave={megaLeave}
            >
              <Link
                to={cat.path}
                className={`mega-nav__link${openMega === cat.id ? ' mega-nav__link--active' : ''}`}
              >
                {cat.label}
                <FiChevronDown className="chevron" />
              </Link>

              {/* Full-viewport-width mega dropdown */}
              <div
                className={`mega-dropdown${openMega === cat.id ? " mega-dropdown--open" : ""}`}
                onMouseEnter={() => megaEnter(cat.id)}
                onMouseLeave={megaLeave}
              >
                <div className="mega-dropdown__inner">
                  {/* Sub-type pill bar (e.g. All / Necklaces / Pendants) */}
                  {cat.subs && (
                    <div className="mega-type-bar">
                      {cat.subs.map(sub => (
                        <Link key={sub.label} to={sub.path} className="mega-type-bar__link">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Sections + promos side-by-side */}
                  <div className="mega-dropdown__body">
                    {/* 4 section columns */}
                    <div className="mega-dropdown__sections">
                      {Object.entries(cat.sections).map(([title, items]) => (
                        <div key={title} className="mega-section">
                          <h4 className="mega-section__title">{title}</h4>
                          <ul className="mega-section__list">
                            {items.map((item, i) => {
                              const isPriceRange = typeof item === 'object' && item !== null;
                              const key = isPriceRange ? item.min : item;
                              let to;
                              if (isPriceRange) {
                                to = `${cat.path}?priceMin=${item.min}${item.max != null ? `&priceMax=${item.max}` : ''}`;
                              } else if (title === 'By Metal & Stone') {
                                // Route material/stone links to cross-category collection pages
                                to = materialToUrl(item) ?? `${cat.path}?filter=${encodeURIComponent(item)}`;
                              } else {
                                to = `${cat.path}?filter=${encodeURIComponent(item)}`;
                              }
                              return (
                                <li key={key}>
                                  <Link to={to}>{isPriceRange ? item.node : item}</Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Promo cards */}
                    <div className="mega-dropdown__promos">
                      {cat.promos.map((promo) => (
                        <Link key={promo.title} to={promo.link} className="mega-promo">
                          <div className="mega-promo__img">
                            {promo.img && (
                              <img
                                src={promo.img}
                                alt={promo.title}
                                loading="lazy"
                                decoding="async"
                                width="200"
                                height="120"
                              />
                            )}
                          </div>
                          <div className="mega-promo__info">
                            <p className="mega-promo__title">{promo.title}</p>
                            <span className="mega-promo__desc">{promo.desc}</span>
                            <span className="mega-promo__cta">Shop Now →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <span className="mega-nav__sep" aria-hidden="true" />

          {SIMPLE_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="mega-nav__link mega-nav__link--plain"
            >
              {link.label}
            </Link>
          ))}
        </nav>

      </div>
    </nav>
  );
}
