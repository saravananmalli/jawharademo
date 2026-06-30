import { useState, useEffect } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Save, Store, Bell, CreditCard, Truck, Globe, Palette,
  X, Plus, Clock,
} from 'lucide-react';
import { Box, Paper, Typography } from '@mui/material';
import {
  Button, Card, CardBody, Input, Textarea, Toggle,
  PageHeader, Skeleton,
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
    <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mb: 2, mt: 0.5 }}>
      {children}
    </Typography>
  );
}

function AedInput({ label, value, onChange, helper }) {
  return (
    <Box>
      {label && <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 0.75 }}>{label}</Typography>}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ position: 'absolute', left: 12, fontSize: 13, color: 'text.disabled', pointerEvents: 'none', userSelect: 'none' }}>AED</Typography>
        <Box
          component="input"
          type="number"
          value={value}
          onChange={onChange}
          sx={{
            width: '100%', pl: 6, pr: 2, py: 1.25, fontSize: 14,
            border: '1px solid', borderColor: 'divider', borderRadius: 2,
            bgcolor: 'background.paper', color: 'text.primary',
            outline: 'none', fontFamily: 'inherit',
            '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
          }}
        />
      </Box>
      {helper && <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>{helper}</Typography>}
    </Box>
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
    } catch {}
    finally { setDeliverySaving(false); }
  };

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      await api.put('/settings', { branding });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
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
    return <Button onClick={handleSave} icon={Save}>Save Settings</Button>;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title="Settings" subtitle="Configure your store preferences" />

      {saved && (
        <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid', bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <Typography sx={{ fontSize: 13, color: 'success.main' }}>Settings saved successfully.</Typography>
        </Paper>
      )}

      <Card>
        {/* Tab navigation */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5, p: 0.75, bgcolor: 'action.hover', borderRadius: 2.5, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Box
                  key={tab.id}
                  component="button"
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0,
                    px: 1.5, py: 1, borderRadius: 2, fontSize: 13, fontWeight: 500,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                    bgcolor: isActive ? 'background.paper' : 'transparent',
                    color: isActive ? 'text.primary' : 'text.secondary',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    '&:hover': { color: isActive ? 'text.primary' : 'text.primary', bgcolor: isActive ? 'background.paper' : 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </Box>
              );
            })}
          </Box>
        </Box>

        <CardBody>
          {/* Store */}
          {activeTab === 'store' && (
            <Box>
              <SectionLabel>Store Identity</SectionLabel>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                <Input label="Store Name" value={store.name} onChange={e => setStore(s => ({ ...s, name: e.target.value }))} />
                <Input label="Contact Email" type="email" value={store.email} onChange={e => setStore(s => ({ ...s, email: e.target.value }))} />
                <Input label="Phone Number" value={store.phone} onChange={e => setStore(s => ({ ...s, phone: e.target.value }))} />
                <Input label="Currency" value={store.currency} onChange={e => setStore(s => ({ ...s, currency: e.target.value }))} />
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <Input label="Store Address" value={store.address} onChange={e => setStore(s => ({ ...s, address: e.target.value }))} />
                </Box>
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <Input label="Logo URL" value={store.logo} onChange={e => setStore(s => ({ ...s, logo: e.target.value }))} placeholder="https://..." />
                  {store.logo && (
                    <Box sx={{ mt: 1.5 }}>
                      <Box component="img" src={getImageUrl(store.logo)} alt="Logo preview" sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }} />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Box>
              <SectionLabel>Alert Preferences</SectionLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Toggle label="New Order Received" helper="Get notified when a new order is placed" checked={notif.newOrder} onChange={e => setNotif(n => ({ ...n, newOrder: e.target.checked }))} />
                <Toggle label="Low Stock Alert" helper="Get notified when a product runs low on stock" checked={notif.lowStock} onChange={e => setNotif(n => ({ ...n, lowStock: e.target.checked }))} />
                <Toggle label="New Customer Review" helper="Get notified when a customer leaves a review" checked={notif.newReview} onChange={e => setNotif(n => ({ ...n, newReview: e.target.checked }))} />
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2.5 }}>
                  <Toggle label="Email Notifications" helper="Receive all notifications via email" checked={notif.emailNotif} onChange={e => setNotif(n => ({ ...n, emailNotif: e.target.checked }))} />
                </Box>
              </Box>
            </Box>
          )}

          {/* Payment */}
          {activeTab === 'payment' && (
            <Box>
              <SectionLabel>Payment Methods</SectionLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
                <Toggle label="Cash on Delivery (COD)" helper="Allow customers to pay when they receive the order" checked={payment.cod} onChange={e => setPayment(p => ({ ...p, cod: e.target.checked }))} />
                <Toggle label="Credit / Debit Card" helper="Accept online card payments" checked={payment.card} onChange={e => setPayment(p => ({ ...p, card: e.target.checked }))} />
                <Toggle label="Bank Transfer" helper="Allow customers to pay via bank transfer" checked={payment.bankTransfer} onChange={e => setPayment(p => ({ ...p, bankTransfer: e.target.checked }))} />
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 3 }} />
              <SectionLabel>Order Limits</SectionLabel>
              <Box sx={{ maxWidth: 224 }}>
                <AedInput label="Minimum Order Amount" value={payment.minOrder} onChange={e => setPayment(p => ({ ...p, minOrder: e.target.value }))} />
              </Box>
            </Box>
          )}

          {/* Shipping */}
          {activeTab === 'shipping' && (
            <Box>
              <SectionLabel>Shipping Rates</SectionLabel>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, mb: 4 }}>
                <AedInput label="Free Shipping Threshold" value={shipping.freeThreshold} onChange={e => setShipping(s => ({ ...s, freeThreshold: e.target.value }))} helper="Orders above this amount get free shipping" />
                <AedInput label="Standard Fee" value={shipping.standardFee} onChange={e => setShipping(s => ({ ...s, standardFee: e.target.value }))} />
                <AedInput label="Express Fee" value={shipping.expressFee} onChange={e => setShipping(s => ({ ...s, expressFee: e.target.value }))} />
              </Box>
              <Toggle label="Enable Same-Day Delivery" helper="Offer same-day delivery as an option at checkout" checked={shipping.sameDay} onChange={e => setShipping(s => ({ ...s, sameDay: e.target.checked }))} />
            </Box>
          )}

          {/* Delivery Zones */}
          {activeTab === 'delivery' && (
            <Box>
              {deliveryLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Skeleton height={16} width={176} />
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                  <Skeleton height={16} width={144} sx={{ mt: 2 }} />
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} height={36} />)}
                  <Skeleton height={36} width={112} sx={{ mt: 1 }} />
                </Box>
              ) : (
                <>
                  <SectionLabel>Delivery Restriction</SectionLabel>
                  <Box sx={{ mb: 3 }}>
                    <Toggle
                      label="Enable International Delivery (allow all countries)"
                      helper="When off, only the countries listed below can place orders."
                      checked={delivery.enableInternationalDelivery}
                      onChange={e => setDelivery(d => ({ ...d, enableInternationalDelivery: e.target.checked }))}
                    />
                  </Box>

                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 3 }} />
                  <SectionLabel>Supported Countries</SectionLabel>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                    {delivery.supportedCountryCodes.map((code, i) => (
                      <Box
                        key={code}
                        sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 0.75,
                          px: 1.5, py: 0.5, borderRadius: 5, fontSize: 13, fontWeight: 500,
                          bgcolor: 'rgba(99,102,241,0.08)', color: 'primary.main',
                          border: '1px solid', borderColor: 'rgba(99,102,241,0.25)',
                        }}
                      >
                        <span>{delivery.supportedCountryNames[i]} ({code})</span>
                        {delivery.supportedCountryCodes.length > 1 && (
                          <Box
                            component="button"
                            onClick={() => removeCountry(i)}
                            sx={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'primary.main', p: 0, opacity: 0.6, '&:hover': { opacity: 1 } }}
                          >
                            <X size={13} />
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>

                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mb: 1 }}>Quick add GCC countries:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3.5 }}>
                    {COUNTRY_PRESETS.map(p => (
                      <Box
                        key={p.code}
                        component="button"
                        onClick={() => addPreset(p)}
                        disabled={delivery.supportedCountryCodes.includes(p.code)}
                        sx={{
                          px: 1.5, py: 0.5, borderRadius: 5, fontSize: 12, fontWeight: 500,
                          border: '1px solid', borderColor: 'divider', bgcolor: 'transparent',
                          color: 'text.secondary', cursor: 'pointer', fontFamily: 'inherit',
                          '&:hover:not(:disabled)': { borderColor: 'primary.light', color: 'primary.main' },
                          '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
                          transition: 'colors 0.15s',
                        }}
                      >
                        {p.name}
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 3.5 }}>
                    <Box sx={{ width: 128 }}>
                      <Input label="Country Code" placeholder="e.g. SA" value={newCountryCode} onChange={e => setNewCountryCode(e.target.value.toUpperCase())} maxLength={3} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Input label="Country Name" placeholder="e.g. Saudi Arabia" value={newCountryName} onChange={e => setNewCountryName(e.target.value)} />
                    </Box>
                    <Button variant="secondary" icon={Plus} onClick={addCountry} disabled={!newCountryCode || !newCountryName}>Add</Button>
                  </Box>

                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 3 }} />
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
            </Box>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <SectionLabel>Website Logo</SectionLabel>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
                  Used in the browser header and desktop navigation. Recommended: PNG, transparent background, min 200×60 px.
                </Typography>
                <ImageUploader
                  key={`website-${branding.websiteLogo}`}
                  images={branding.websiteLogo ? [branding.websiteLogo] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, websiteLogo: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </Box>

              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

              <Box>
                <SectionLabel>Mobile App Logo</SectionLabel>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
                  Displayed in the mobile header and splash screens. Recommended: PNG, square or wide, min 512×512 px.
                </Typography>
                <ImageUploader
                  key={`mobile-${branding.mobileLogo}`}
                  images={branding.mobileLogo ? [branding.mobileLogo] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, mobileLogo: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </Box>

              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

              <Box>
                <SectionLabel>Favicon</SectionLabel>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
                  Shown in browser tabs and bookmarks. Recommended: PNG, square, 32×32 or 64×64 px.
                </Typography>
                <ImageUploader
                  key={`favicon-${branding.favicon}`}
                  images={branding.favicon ? [branding.favicon] : []}
                  onChange={([url] = []) => setBranding(b => ({ ...b, favicon: url || '' }))}
                  maxImages={1}
                  single
                  category="branding"
                />
              </Box>
            </Box>
          )}

          {/* Save bar */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            {renderSaveButton()}
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
}
