import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../Products/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getImageUrl } from '../../utils/imageUrl';
import './ChatAgent.scss';

// ── Constants ─────────────────────────────────────────────────────────────────

const TRENDING_SEARCHES = [
  'Diamond Ring', 'Gold Necklace', 'Engagement Ring', 'Bridal Set',
  'Pearl Earrings', 'Rose Gold Bracelet', 'Diamond Pendant', '18K Gold Ring',
  'Wedding Band', 'Anniversary Gift', 'Eid Gift', 'Diamond Earrings',
  'Gold Bangle', 'Luxury Necklace', 'Birthday Gift',
];

const DISCOVER_GUEST = [
  { label: 'Rings',        query: 'Show me rings' },
  { label: 'Necklaces',    query: 'Show me necklaces' },
  { label: 'Bridal',       query: 'Show me bridal collection' },
  { label: 'Gift Finder',  query: 'Help me find a gift' },
  { label: 'Best Sellers', query: 'Show me best sellers' },
  { label: 'New Arrivals', query: 'Show me new arrivals' },
];

const DISCOVER_AUTH = [
  { label: 'My Orders',    query: 'Where is my order?' },
  { label: 'My Cart',      query: 'What is in my cart?' },
  { label: 'My Wishlist',  query: 'Show my wishlist' },
  { label: 'Gift Finder',  query: 'Help me find a gift' },
  { label: 'Best Sellers', query: 'Show me best sellers' },
  { label: 'Recommend',    query: 'Recommend something for me' },
];

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=%2B971565071902&text&type=phone_number&app_absent=0';
const WHATSAPP_CHIP = 'Chat on WhatsApp';

// Maps chip labels → natural-language queries so the AI gets meaningful context
const CHIP_QUERY_MAP = {
  // Return / refund / exchange
  'Initiate Return':    'I would like to initiate a return for my order. What is the process?',
  'Refund Status':      'What is the current status of my refund? Has it been processed?',
  'Exchange Item':      'I would like to exchange an item from my order. How do I do that?',
  // Order support
  'Track Order':        'Where is my order? Can you track it for me?',
  'Track Package':      'Where is my package? Can you provide tracking details?',
  'Recent Orders':      'Show me my recent orders',
  'View Orders':        'Show me my order history',
  'Return Item':        'I want to return an item from my order',
  'Download Invoice':   'How can I download the invoice for my order?',
  'Delivery Status':    'What is the status of my delivery?',
  'Delivery Support':   'I need help with my delivery',
  'Change Address':     'I need to change my delivery address',
  'Update Address':     'I want to update my account address',
  'Payment Methods':    'How can I manage my saved payment methods?',
  // Account / navigation
  'My Orders':          'Show me my orders',
  'My Cart':            'What is in my cart?',
  'My Wishlist':        'Show my wishlist',
  'Shop Again':         'I would like to shop again — show me recommendations',
  'Contact Support':    'I need to speak with customer support',
  // Shopping
  'Gold Jewellery':     'Show me gold jewellery',
  'Diamond Jewellery':  'Show me diamond jewellery',
  'Best Value':         'Show me best value jewelry pieces',
  // Customer service
  'Installment Plans':  'Do you offer installment or payment plan options?',
  'Customization':      'Can I customize or personalize a jewelry piece?',
  'Warranty & Care':    'Do you offer warranty and aftercare services for your jewelry?',
};

const QUICK_REPLIES_GUEST = ["Today's Gold Price", 'Engagement Ring', 'Gold Necklace', 'I need a gift', WHATSAPP_CHIP];
const QUICK_REPLIES_AUTH  = ["Today's Gold Price", 'Track My Order', 'My Orders', 'My Cart', WHATSAPP_CHIP];

const NON_ENGLISH_LANGUAGE_MSG =
  'Currently, our chatbot supports English only. We are actively working on adding support for additional languages, which will be available soon. Please use English for now. Thank you for your patience.';

// Detects non-Latin scripts: Arabic, CJK, Japanese, Korean, Cyrillic, Indic, Thai, etc.
function isNonEnglish(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]|[\u3040-\u309F\u30A0-\u30FF]|[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]|[\u0400-\u04FF\u0500-\u052F]|[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]|[\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F]/.test(text);
}

// ── Order status style map ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: 'Order Placed',     emoji: '📋', bg: '#FEF3C7', color: '#92400E' },
  processing: { label: 'Processing',       emoji: '⚙️',  bg: '#DBEAFE', color: '#1E40AF' },
  shipped:    { label: 'Out for Delivery', emoji: '🚚', bg: '#EDE9FE', color: '#5B21B6' },
  delivered:  { label: 'Delivered',        emoji: '✅', bg: '#D1FAE5', color: '#065F46' },
  cancelled:  { label: 'Cancelled',        emoji: '❌', bg: '#FEE2E2', color: '#991B1B' },
};

// ── Greeting builder ──────────────────────────────────────────────────────────
function makeGreeting(isAuthenticated, userName) {
  return {
    role: 'assistant',
    content: isAuthenticated && userName
      ? `Welcome back, ${userName.split(' ')[0]} ✨ I'm Layla, your jewellery concierge. I can track your orders, help you find the perfect piece, or anything else — just ask!`
      : "Welcome to Jawhara Jewellery ✨ I'm Layla, your personal jewellery consultant. Whether you're shopping for yourself or someone special, I'm here to help.",
    products: [],
    orderCards: [],
    quickReplies: isAuthenticated ? QUICK_REPLIES_AUTH : QUICK_REPLIES_GUEST,
    isGreeting: true,
  };
}

// ── Gold price helpers ────────────────────────────────────────────────────────
function formatTimeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

function GoldPriceCard({ prices, updatedAt }) {
  const timeStr = updatedAt ? formatTimeAgo(updatedAt) : 'just now';
  return (
    <div className="gold-price-card">
      {prices.map(({ karat, price }) => (
        <div key={karat} className="gold-price-row">
          <span className="gold-price-row__karat">{karat}</span>
          <span className="gold-price-row__dot">•</span>
          <span className="gold-price-row__price">
            AED {price % 1 === 0 ? price : price.toFixed(2)}
            <span className="gold-price-row__unit">/g</span>
          </span>
        </div>
      ))}
      <div className="gold-price-card__footer">Updated {timeStr}</div>
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onNavigate, onQuickReply }) {
  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const firstItem = order.items?.[0];
  const extraCount = (order.items?.length || 0) - 1;
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="chat-order-card">
      <div className="chat-order-card__header">
        <span className="chat-order-card__number">{order.orderNumber}</span>
        <span className="chat-order-card__status" style={{ background: s.bg, color: s.color }}>
          {s.emoji} {s.label}
        </span>
      </div>

      {firstItem && (
        <div className="chat-order-card__item">
          {firstItem.image ? (
            <img src={getImageUrl(firstItem.image)} alt={firstItem.name} className="chat-order-card__img" />
          ) : (
            <div className="chat-order-card__img-placeholder">💍</div>
          )}
          <div className="chat-order-card__item-info">
            <p className="chat-order-card__item-name">{firstItem.name}</p>
            {extraCount > 0 && (
              <p className="chat-order-card__item-more">+{extraCount} more item{extraCount > 1 ? 's' : ''}</p>
            )}
            {date && <p className="chat-order-card__item-date">{date}</p>}
          </div>
          <div className="chat-order-card__amount">
            {order.totalAmount?.toLocaleString()} AED
          </div>
        </div>
      )}

      <div className="chat-order-card__ctas">
        <Link to="/account" className="chat-order-card__cta chat-order-card__cta--primary" onClick={onNavigate}>
          Track Order
        </Link>
        <Link to="/account" className="chat-order-card__cta chat-order-card__cta--secondary" onClick={onNavigate}>
          View Order
        </Link>
        {order.status === 'delivered' ? (
          <button
            className="chat-order-card__cta chat-order-card__cta--ghost"
            onClick={() => onQuickReply(`I want to return order ${order.orderNumber}`)}
          >
            Return Item
          </button>
        ) : order.status !== 'cancelled' ? (
          <button
            className="chat-order-card__cta chat-order-card__cta--ghost"
            onClick={() => onQuickReply(`I need help with order ${order.orderNumber}`)}
          >
            Get Help
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Product Carousel ──────────────────────────────────────────────────────────
function ProductCarousel({ products, onNavigate, intent }) {
  if (!products?.length) return null;
  const count = products.length;
  const label = intent === 'wishlist' ? '♡ Your Wishlist' : intent === 'cart' ? '🛍 Your Cart' : '✨ Recommendations';
  return (
    <div className="chat-carousel">
      <div className="chat-carousel__header">
        <span className="chat-carousel__label">{label}</span>
        <span className="chat-carousel__count">{count} {intent === 'cart' || intent === 'wishlist' ? `item${count !== 1 ? 's' : ''}` : `piece${count !== 1 ? 's' : ''}`}</span>
      </div>
      <div className="chat-carousel__track">
        {products.map((p) => (
          <div key={p._id} className="chat-carousel__item" onClick={onNavigate}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {count > 1 && <p className="chat-carousel__hint">Swipe to explore →</p>}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast, onQuickReply, onNavigate }) {
  const isAssistant = msg.role === 'assistant';

  if (!isAssistant) {
    return (
      <div className="chat-msg chat-msg--user">
        <div className="chat-msg__content">
          <div className="chat-bubble chat-bubble--user">{msg.content}</div>
        </div>
      </div>
    );
  }

  const paragraphs = msg.content.split('\n').filter(line => line.trim());
  const hasProducts    = msg.products?.length > 0;
  const hasOrders      = msg.orderCards?.length > 0;
  const hasGoldPrices  = msg.goldPrices?.length > 0;
  const hasChips       = isLast && msg.quickReplies?.length > 0;
  const chipsAreFollowUp = hasChips && (hasProducts || hasGoldPrices);

  return (
    <div className="chat-msg chat-msg--assistant">
      <div className="chat-msg__avatar">
        <img src="/bot.png" alt="Layla" />
      </div>

      <div className="chat-msg__content">
        <div className="chat-response">

          {/* SECTION 1 — Priority text */}
          <div className="chat-response__body">
            {paragraphs.map((p, i) => (
              <p key={i} className="chat-response__para">{p}</p>
            ))}
          </div>

          {/* SECTION 2a — Order cards (support mode) */}
          {hasOrders && (
            <div className="chat-section chat-section--orders chat-section--appear" style={{ animationDelay: '80ms' }}>
              {msg.orderCards.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onNavigate={onNavigate}
                  onQuickReply={onQuickReply}
                />
              ))}
            </div>
          )}

          {/* SECTION 2b — Product recommendations */}
          {hasProducts && (
            <div className="chat-section chat-section--products chat-section--appear" style={{ animationDelay: '120ms' }}>
              <ProductCarousel products={msg.products} onNavigate={onNavigate} intent={msg.intent} />
            </div>
          )}

          {/* SECTION 2c — Gold price card */}
          {hasGoldPrices && (
            <div className="chat-section chat-section--gold chat-section--appear" style={{ animationDelay: '100ms' }}>
              <GoldPriceCard prices={msg.goldPrices} updatedAt={msg.updatedAt} />
            </div>
          )}

          {/* SECTION 3 — Follow-up chips */}
          {hasChips && (
            <div
              className={`chat-section chat-section--chips chat-section--appear${chipsAreFollowUp ? ' chat-section--followup' : ''}`}
              style={{ animationDelay: chipsAreFollowUp ? '220ms' : '80ms' }}
            >
              {chipsAreFollowUp && (
                <p className="chat-chips-label">What would you prefer?</p>
              )}
              <div className="chat-chips">
                {msg.quickReplies.map((q) =>
                  q === WHATSAPP_CHIP ? (
                    <a
                      key={q}
                      className="chat-chip chat-chip--whatsapp"
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="chat-chip__wa-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {q}
                    </a>
                  ) : (
                    <button key={q} className="chat-chip" onClick={() => onQuickReply(q)}>
                      {q}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="chat-msg chat-msg--assistant">
      <div className="chat-msg__avatar">
        <img src="/bot.png" alt="Layla" />
      </div>
      <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatAgent() {
  const { user, isAuthenticated } = useAuth();
  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState(() => [makeGreeting(isAuthenticated, user?.name)]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const session   = useRef({ budget: null, budgetMin: null, budgetMax: null, occasion: null, category: null, mode: null });

  // Reset chat greeting whenever auth state changes
  useEffect(() => {
    setMessages([makeGreeting(isAuthenticated, user?.name)]);
    session.current = { budget: null, budgetMin: null, budgetMax: null, occasion: null, category: null, mode: null };
  }, [isAuthenticated, user?.name]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  function updateSession(text) {
    const t = text.toLowerCase();
    // Budget range: "1000-3000", "500 to 1000", "between 500 and 1000"
    const rangeMatch = t.match(/(?:between\s+|from\s+)?(\d+)\s*(?:-|–|to|and)\s*(\d+)/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1]), b = parseInt(rangeMatch[2]);
      if (a !== b) {
        session.current.budgetMin = Math.min(a, b);
        session.current.budgetMax = Math.max(a, b);
        session.current.budget = null;
      }
    } else {
      const ceilingMatch = t.match(/(?:under|below|within|max|upto|up to)\s*(?:aed\s*)?(\d+)/);
      if (ceilingMatch) {
        session.current.budgetMin = null;
        session.current.budgetMax = parseInt(ceilingMatch[1]);
        session.current.budget = parseInt(ceilingMatch[1]);
      }
    }
    const occasions = ['anniversary', 'birthday', 'wedding', 'engagement', 'eid', 'valentine', 'graduation'];
    const occ = occasions.find(o => t.includes(o));
    if (occ) session.current.occasion = occ;
    const cats = ['ring', 'necklace', 'bracelet', 'earring', 'pendant'];
    const cat = cats.find(c => t.includes(c));
    if (cat) session.current.category = cat;
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setInput(val);
    if (val.trim().length >= 2) {
      const q = val.toLowerCase();
      setSuggestions(TRENDING_SEARCHES.filter(s => s.toLowerCase().includes(q)).slice(0, 4));
    } else {
      setSuggestions([]);
    }
  }

  const sendMessage = useCallback(async (text) => {
    const raw = (typeof text === 'string' ? text : input).trim();
    if (!raw || loading) return;
    const trimmed = CHIP_QUERY_MAP[raw] ?? raw;

    setSuggestions([]);

    if (isNonEnglish(trimmed)) {
      setInput('');
      setMessages(prev => [
        ...prev,
        { role: 'user', content: raw },
        {
          role: 'assistant',
          content: NON_ENGLISH_LANGUAGE_MSG,
          products: [],
          orderCards: [],
          quickReplies: isAuthenticated ? QUICK_REPLIES_AUTH : QUICK_REPLIES_GUEST,
        },
      ]);
      return;
    }

    updateSession(trimmed);

    const userMsg = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      // Exclude the local greeting bubble — Anthropic requires messages to start with 'user'
      const history = updated
        .filter(m => (m.role === 'user' || m.role === 'assistant') && !m.isGreeting)
        .map(m => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/chat', {
        messages: history,
        sessionContext: session.current,
        cartItems,
        wishlistItems,
      });

      // Persist mode so next message knows the conversation context
      if (data.mode) session.current.mode = data.mode;

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          products: data.products || [],
          orderCards: data.orderCards || [],
          goldPrices: data.goldPrices || null,
          updatedAt: data.updatedAt || null,
          dateStr: data.dateStr || null,
          quickReplies: data.quickReplies || [],
          intent: data.intent,
          mode: data.mode,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I had a moment of trouble. Please try again ✨",
          products: [],
          orderCards: [],
          quickReplies: isAuthenticated ? QUICK_REPLIES_AUTH : QUICK_REPLIES_GUEST,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, cartItems, wishlistItems, isAuthenticated]);

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleNavigate() {
    setOpen(false);
  }

  function handleClearChat() {
    setMessages([makeGreeting(isAuthenticated, user?.name)]);
    session.current = { budget: null, budgetMin: null, budgetMax: null, occasion: null, category: null, mode: null };
    setInput('');
    setSuggestions([]);
  }

  const discoverCards = isAuthenticated ? DISCOVER_AUTH : DISCOVER_GUEST;
  const hasMessages   = messages.length > 1;

  return (
    <div className="chat-agent">
      {open && (
        <div className="chat-agent__panel">
          {/* Header */}
          <div className="chat-agent__header">
            <div className="chat-agent__header-left">
              <div className="chat-agent__avatar-ring">
                <div className="chat-agent__avatar">
                  <img src="/bot.png" alt="Layla" />
                </div>
                <div className="chat-agent__online-dot" />
              </div>
              <div>
                <div className="chat-agent__name">Layla — Jewellery Consultant</div>
                <div className="chat-agent__tagline">Jawhara Jewellery ✦ UAE</div>
              </div>
            </div>
            <div className="chat-agent__header-right">
              {hasMessages && (
                <button className="chat-agent__clear" onClick={handleClearChat}>
                  clear chat
                </button>
              )}
              <button className="chat-agent__close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-agent__body">
            {!hasMessages && (
              <div className="chat-discover">
                <p className="chat-discover__label">
                  {isAuthenticated ? 'What can I help you with?' : 'Explore our collections'}
                </p>
                <div className="chat-discover__grid">
                  {discoverCards.map(c => (
                    <button key={c.label} className="chat-discover__card" onClick={() => sendMessage(c.query)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isLast={i === messages.length - 1}
                onQuickReply={sendMessage}
                onNavigate={handleNavigate}
              />
            ))}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-agent__footer">
            {suggestions.length > 0 && (
              <div className="chat-suggestions">
                {suggestions.map(s => (
                  <button key={s} className="chat-suggestions__item" onMouseDown={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form className="chat-agent__form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className="chat-agent__input"
                value={input}
                onChange={handleInputChange}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder="Ask Layla anything…"
                disabled={loading}
                autoComplete="off"
              />
              <button
                className="chat-agent__send"
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className={`chat-agent__toggle${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open jewelry assistant"
      >
        {open ? '✕' : (
          <>
            <img src="/bot.png" alt="Layla" className="chat-agent__toggle-avatar" />
            <span className="chat-agent__toggle-label">Ask Layla AI Expert</span>
          </>
        )}
      </button>
    </div>
  );
}
