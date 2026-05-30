import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaPinterest } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import './Footer.scss';

const FOOTER_LINKS = {
  company: ['About Us', 'Careers', 'Press & Media', 'Store Locator', 'Blog'],
  support: ['Customer Support', 'FAQ', 'Shipping Policy', 'Return Policy', 'Track Order'],
  legal: ['Privacy Policy', 'Terms & Conditions', 'Cookie Policy', 'Accessibility'],
};

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with ${email}!`);
      setEmail('');
    }
  };

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__inner">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">Jawhara</Link>
            <p className="footer__tagline">
              Crafting timeless jewellery for over 30 years. Every piece tells a story of elegance and artistry.
            </p>
            <div className="footer__social">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
              <a href="https://pinterest.com" aria-label="Pinterest" target="_blank" rel="noopener noreferrer"><FaPinterest /></a>
            </div>
          </div>

          <div className="footer__links">
            <div className="footer__col">
              <h4 className="footer__col-title">Company</h4>
              <ul>
                {FOOTER_LINKS.company.map(link => (
                  <li key={link}><Link to="#">{link}</Link></li>
                ))}
              </ul>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">Support</h4>
              <ul>
                {FOOTER_LINKS.support.map(link => (
                  <li key={link}><Link to="#">{link}</Link></li>
                ))}
              </ul>
            </div>

            <div className="footer__col">
              <h4 className="footer__col-title">Legal</h4>
              <ul>
                {FOOTER_LINKS.legal.map(link => (
                  <li key={link}><Link to="#">{link}</Link></li>
                ))}
              </ul>
            </div>

            <div className="footer__col footer__col--newsletter">
              <h4 className="footer__col-title">{t.footer.newsletter}</h4>
              <p className="footer__newsletter-desc">
                Get exclusive offers, new arrivals, and style inspiration delivered to your inbox.
              </p>
              <form className="footer__newsletter" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  required
                />
                <button type="submit">{t.footer.subscribe}</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p>&copy; {new Date().getFullYear()} Jawhara Jewellery. {t.footer.allRightsReserved}</p>
          <div className="footer__payments">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
