import { useState, useEffect } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Save, Store, Bell, CreditCard, Truck, Globe, Palette,
  X, Plus, Shield,
} from 'lucide-react';
import {
  Button, Card, CardBody, Input, Textarea, Toggle,
  Badge, PageHeader, Skeleton, Spinner,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const COUNTRY_PRESETS = [
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'OM', name: 'Oman' },
  { code: 'BH', name: 'Bahrain' },
];

const TABS = [
  { id: 'store',         label: 'Store',          icon: Store },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'payment',       label: 'Payment',        icon: CreditCard },
  { id: 'shipping',      label: 'Shipping',       icon: Truck },
  { id: 'delivery',      label: 'Delivery Zones', icon: Globe },
  { id: 'branding',      label: 'Branding',       icon: Palette },
];

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 mt-1">
      {children}
    </p>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved]         = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving]   = useState(false);
  const [brandingSaving, setBrandingSaving]   = useState(false);

  const [branding, setBranding] = useState({ websiteLogo: '', mobileLogo: '', favicon: '' });
  const [delivery, setDelivery] = useState({
    enableInternationalDelivery: false,
    supportedCountryCodes: ['AE'],
    supportedCountryNames: ['UAE'],
    restrictionMessage: 'Currently we deliver only within UAE. We will expand to more countries soon.',
  });
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');

  const [store, setStore] = useState({
    name: 'Jawhara Jewellery',
    email: 'admin@jawhara.ae',
    phone: '+971 4 123 4567',
    address: 'Dubai, UAE',
    currency: 'AED',
    logo: '',
  });

  const [notif, setNotif] = useState({
    newOrder: true,
    lowStock: true,
    newReview: false,
    emailNotif: true,
  });

  const [payment, setPayment] = useState({
    cod: true,
    card: false,
    bankTransfer: false,
    minOrder: '50',
  });

  const [shipping, setShipping] = useState({
    freeThreshold: '300',
    standardFee: '15',
    expressFee: '30',
    sameDay: false,
  });

  useEffect(() => {
    setDeliveryLoading(true);
    api.get('/settings')
      .then(({ data }) => {
        if (data.success) {
          if (data.data?.delivery) setDelivery(data.data.delivery);
          if (data.data?.branding) setBranding(data.data.branding);
        }
      })
      .catch(() => {})
      .finally(() => setDeliveryLoading(false));
  }, []);

  const addCountry = () => {
    const code = newCountryCode.trim().toUpperCase();
    const name = newCountryName.trim();
    if (!code || !name || delivery.supportedCountryCodes.includes(code)) return;
    setDelivery(d => ({
      ...d,
      supportedCountryCodes: [...d.supportedCountryCodes, code],
      supportedCountryNames: [...d.supportedCountryNames, name],
    }));
    setNewCountryCode('');
    setNewCountryName('');
  };

  const removeCountry = (idx) => {
    setDelivery(d => ({
      ...d,
      supportedCountryCodes: d.supportedCountryCodes.filter((_, i) => i !== idx),
      supportedCountryNames: d.supportedCountryNames.filter((_, i) => i !== idx),
    }));
  };

  const addPreset = (preset) => {
    if (delivery.supportedCountryCodes.includes(preset.code)) return;
    setDelivery(d => ({
      ...d,
      supportedCountryCodes: [...d.supportedCountryCodes, preset.code],
      supportedCountryNames: [...d.supportedCountryNames, preset.name],
    }));
  };

  const saveDelivery = async () => {
    setDeliverySaving(true);
    try {
      await api.put('/settings', { delivery });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* handled by global interceptor */ }
    finally { setDeliverySaving(false); }
  };

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      await api.put('/settings', { branding });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* handled by global interceptor */ }
    finally { setBrandingSaving(false); }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const renderSaveButton = () => {
    if (activeTab === 'delivery') {
      return (
        <Button onClick={saveDelivery} loading={deliverySaving} icon={deliverySaving ? undefined : Save}>
          {deliverySaving ? 'Saving…' : 'Save Delivery Settings'}
        </Button>
      );
    }
    if (activeTab === 'branding') {
      return (
        <Button onClick={saveBranding} loading={brandingSaving} icon={brandingSaving ? undefined : Save}>
          {brandingSaving ? 'Saving…' : 'Save Branding'}
        </Button>
      );
    }
    return (
      <Button onClick={handleSave} icon={Save}>Save Settings</Button>
    );
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your store preferences"
      />

      {saved && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Settings saved successfully.
        </div>
      )}

      <Card>
        {/* Tab navigation */}
        <div className="px-4 pt-4">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <CardBody>

          {/* ── Store ─────────────────────────────────────────── */}
          {activeTab === 'store' && (
            <div>
              <SectionLabel>Store Identity</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Store Name"
                  value={store.name}
                  onChange={e => setStore(s => ({ ...s, name: e.target.value }))}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={store.email}
                  onChange={e => setStore(s => ({ ...s, email: e.target.value }))}
                />
                <Input
                  label="Phone Number"
                  value={store.phone}
                  onChange={e => setStore(s => ({ ...s, phone: e.target.value }))}
                />
                <Input
                  label="Currency"
                  value={store.currency}
                  onChange={e => setStore(s => ({ ...s, currency: e.target.value }))}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Store Address"
                    value={store.address}
                    onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Logo URL"
                    value={store.logo}
                    onChange={e => setStore(s => ({ ...s, logo: e.target.value }))}
                    placeholder="https://..."
                  />
                  {store.logo && (
                    <div className="mt-3">
                      <img
                        src={getImageUrl(store.logo)}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div>
              <SectionLabel>Alert Preferences</SectionLabel>
              <div className="space-y-4">
                <Toggle
                  label="New Order Received"
                  helper="Get notified when a new order is placed"
                  checked={notif.newOrder}
                  onChange={e => setNotif(n => ({ ...n, newOrder: e.target.checked }))}
                />
                <Toggle
                  label="Low Stock Alert"
                  helper="Get notified when a product runs low on stock"
                  checked={notif.lowStock}
                  onChange={e => setNotif(n => ({ ...n, lowStock: e.target.checked }))}
                />
                <Toggle
                  label="New Customer Review"
                  helper="Get notified when a customer leaves a review"
                  checked={notif.newReview}
                  onChange={e => setNotif(n => ({ ...n, newReview: e.target.checked }))}
                />
                <hr className="border-gray-100 dark:border-gray-800" />
                <Toggle
                  label="Email Notifications"
                  helper="Receive all notifications via email"
                  checked={notif.emailNotif}
                  onChange={e => setNotif(n => ({ ...n, emailNotif: e.target.checked }))}
                />
              </div>
            </div>
          )}

          {/* ── Payment ───────────────────────────────────────── */}
          {activeTab === 'payment' && (
            <div>
              <SectionLabel>Payment Methods</SectionLabel>
              <div className="space-y-4 mb-6">
                <Toggle
                  label="Cash on Delivery (COD)"
                  helper="Allow customers to pay when they receive the order"
                  checked={payment.cod}
                  onChange={e => setPayment(p => ({ ...p, cod: e.target.checked }))}
                />
                <Toggle
                  label="Credit / Debit Card"
                  helper="Accept online card payments"
                  checked={payment.card}
                  onChange={e => setPayment(p => ({ ...p, card: e.target.checked }))}
                />
                <Toggle
                  label="Bank Transfer"
                  helper="Allow customers to pay via bank transfer"
                  checked={payment.bankTransfer}
                  onChange={e => setPayment(p => ({ ...p, bankTransfer: e.target.checked }))}
                />
              </div>
              <hr className="border-gray-100 dark:border-gray-800 mb-6" />
              <SectionLabel>Order Limits</SectionLabel>
              <div className="w-56">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Minimum Order Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 text-sm">
                      AED
                    </div>
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={payment.minOrder}
                      onChange={e => setPayment(p => ({ ...p, minOrder: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Shipping ──────────────────────────────────────── */}
          {activeTab === 'shipping' && (
            <div>
              <SectionLabel>Shipping Rates</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Free Shipping Threshold
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 text-sm">AED</div>
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={shipping.freeThreshold}
                      onChange={e => setShipping(s => ({ ...s, freeThreshold: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Orders above this amount get free shipping</p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standard Fee
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 text-sm">AED</div>
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={shipping.standardFee}
                      onChange={e => setShipping(s => ({ ...s, standardFee: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Express Fee
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 text-sm">AED</div>
                    <input
                      type="number"
                      className="w-full pl-12 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={shipping.expressFee}
                      onChange={e => setShipping(s => ({ ...s, expressFee: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <Toggle
                label="Enable Same-Day Delivery"
                helper="Offer same-day delivery as an option at checkout"
                checked={shipping.sameDay}
                onChange={e => setShipping(s => ({ ...s, sameDay: e.target.checked }))}
              />
            </div>
          )}

          {/* ── Delivery Zones ────────────────────────────────── */}
          {activeTab === 'delivery' && (
            <div>
              {deliveryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-4 w-36 mt-4" />
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}
                  <Skeleton className="h-9 w-28 rounded-xl mt-2" />
                </div>
              ) : (
                <>
                  <SectionLabel>Delivery Restriction</SectionLabel>
                  <div className="mb-6 space-y-2">
                    <Toggle
                      label="Enable International Delivery (allow all countries)"
                      helper="When off, only the countries listed below can place orders."
                      checked={delivery.enableInternationalDelivery}
                      onChange={e => setDelivery(d => ({ ...d, enableInternationalDelivery: e.target.checked }))}
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-6" />
                  <SectionLabel>Supported Countries</SectionLabel>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {delivery.supportedCountryCodes.map((code, i) => (
                      <div
                        key={code}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        <span>{delivery.supportedCountryNames[i]} ({code})</span>
                        {delivery.supportedCountryCodes.length > 1 && (
                          <button
                            onClick={() => removeCountry(i)}
                            className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add GCC countries:</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {COUNTRY_PRESETS.map(p => (
                      <button
                        key={p.code}
                        onClick={() => addPreset(p)}
                        disabled={delivery.supportedCountryCodes.includes(p.code)}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-end gap-2 mb-6">
                    <div className="w-32">
                      <Input
                        label="Country Code"
                        placeholder="e.g. SA"
                        value={newCountryCode}
                        onChange={e => setNewCountryCode(e.target.value.toUpperCase())}
                        maxLength={3}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        label="Country Name"
                        placeholder="e.g. Saudi Arabia"
                        value={newCountryName}
                        onChange={e => setNewCountryName(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      icon={Plus}
                      onClick={addCountry}
                      disabled={!newCountryCode || !newCountryName}
                    >
                      Add
                    </Button>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-6" />
                  <SectionLabel>Restriction Message</SectionLabel>
                  <Textarea
                    label="Message shown to customers outside delivery zones"
                    value={delivery.restrictionMessage}
                    onChange={e => setDelivery(d => ({ ...d, restrictionMessage: e.target.value }))}
                    rows={2}
                    helper="Displayed on cart, product pages, and checkout when delivery is unavailable."
                  />
                </>
              )}
            </div>
          )}

          {/* ── Branding ──────────────────────────────────────── */}
          {activeTab === 'branding' && (
            <div className="space-y-8">
              <div>
                <SectionLabel>Website Logo</SectionLabel>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Used in the browser header and desktop navigation. Recommended: PNG, transparent background, min 200×60 px.
                </p>
                <ImageUploader
                  key={`website-${branding.websiteLogo}`}
                  images={branding.websiteLogo ? [branding.websiteLogo] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, websiteLogo: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              <div>
                <SectionLabel>Mobile App Logo</SectionLabel>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Displayed in the mobile header and splash screens. Recommended: PNG, square or wide, min 512×512 px.
                </p>
                <ImageUploader
                  key={`mobile-${branding.mobileLogo}`}
                  images={branding.mobileLogo ? [branding.mobileLogo] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, mobileLogo: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              <div>
                <SectionLabel>Favicon</SectionLabel>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Shown in browser tabs and bookmarks. Recommended: PNG, square, 32×32 or 64×64 px.
                </p>
                <ImageUploader
                  key={`favicon-${branding.favicon}`}
                  images={branding.favicon ? [branding.favicon] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, favicon: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </div>
            </div>
          )}

          {/* Save bar */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            {renderSaveButton()}
          </div>

        </CardBody>
      </Card>
    </div>
  );
}
