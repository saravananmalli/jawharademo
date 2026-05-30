import { useState, useEffect } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Divider, Switch, FormControlLabel, Alert, Tabs, Tab, Avatar,
  InputAdornment, Stack, Chip, CircularProgress,
} from '@mui/material';
import SaveIcon          from '@mui/icons-material/Save';
import StorefrontIcon    from '@mui/icons-material/Storefront';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentIcon       from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PublicIcon        from '@mui/icons-material/Public';
import api from '../../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

const SectionLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, color: 'text.secondary', mb: 2, mt: 0.5 }}
  >
    {children}
  </Typography>
);

const COUNTRY_PRESETS = [
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'OM', name: 'Oman' },
  { code: 'BH', name: 'Bahrain' },
];

export default function Settings() {
  const [tab, setTab]     = useState(0);
  const [saved, setSaved] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [deliverySaving, setDeliverySaving]   = useState(false);
  const [delivery, setDelivery] = useState({
    enableInternationalDelivery: false,
    supportedCountryCodes: ['AE'],
    supportedCountryNames: ['UAE'],
    restrictionMessage: 'Currently we deliver only within UAE. We will expand to more countries soon.',
  });
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => { if (data.success && data.data?.delivery) setDelivery(data.data.delivery); })
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Configure your store preferences</Typography>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully.</Alert>}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1 }}
          >
            <Tab icon={<StorefrontIcon fontSize="small" />}    iconPosition="start" label="Store"         sx={{ minHeight: 52, fontSize: '0.875rem' }} />
            <Tab icon={<NotificationsIcon fontSize="small" />} iconPosition="start" label="Notifications" sx={{ minHeight: 52, fontSize: '0.875rem' }} />
            <Tab icon={<PaymentIcon fontSize="small" />}       iconPosition="start" label="Payment"       sx={{ minHeight: 52, fontSize: '0.875rem' }} />
            <Tab icon={<LocalShippingIcon fontSize="small" />} iconPosition="start" label="Shipping"      sx={{ minHeight: 52, fontSize: '0.875rem' }} />
            <Tab icon={<PublicIcon fontSize="small" />}       iconPosition="start" label="Delivery Zones" sx={{ minHeight: 52, fontSize: '0.875rem' }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>

          {/* ── Store ─────────────────────────────────────────── */}
          <TabPanel value={tab} index={0}>
            <SectionLabel>Store Identity</SectionLabel>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Store Name" value={store.name} onChange={e => setStore(s => ({ ...s, name: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Email" type="email" value={store.email} onChange={e => setStore(s => ({ ...s, email: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone Number" value={store.phone} onChange={e => setStore(s => ({ ...s, phone: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Currency" value={store.currency} onChange={e => setStore(s => ({ ...s, currency: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Store Address" value={store.address} onChange={e => setStore(s => ({ ...s, address: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Logo URL" value={store.logo} onChange={e => setStore(s => ({ ...s, logo: e.target.value }))} placeholder="https://..." />
                {store.logo && (
                  <Box sx={{ mt: 1.5 }}>
                    <Avatar src={store.logo} variant="rounded" sx={{ width: 80, height: 80 }} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Notifications ─────────────────────────────────── */}
          <TabPanel value={tab} index={1}>
            <SectionLabel>Alert Preferences</SectionLabel>
            <Stack spacing={0.5}>
              <FormControlLabel control={<Switch checked={notif.newOrder}  onChange={e => setNotif(n => ({ ...n, newOrder: e.target.checked }))}  color="primary" />} label="New Order Received" />
              <FormControlLabel control={<Switch checked={notif.lowStock}  onChange={e => setNotif(n => ({ ...n, lowStock: e.target.checked }))}  color="primary" />} label="Low Stock Alert" />
              <FormControlLabel control={<Switch checked={notif.newReview} onChange={e => setNotif(n => ({ ...n, newReview: e.target.checked }))} color="primary" />} label="New Customer Review" />
              <Divider sx={{ my: 1.5 }} />
              <FormControlLabel control={<Switch checked={notif.emailNotif} onChange={e => setNotif(n => ({ ...n, emailNotif: e.target.checked }))} color="primary" />} label="Email Notifications" />
            </Stack>
          </TabPanel>

          {/* ── Payment ───────────────────────────────────────── */}
          <TabPanel value={tab} index={2}>
            <SectionLabel>Payment Methods</SectionLabel>
            <Stack spacing={0.5}>
              <FormControlLabel control={<Switch checked={payment.cod}          onChange={e => setPayment(p => ({ ...p, cod: e.target.checked }))}          color="primary" />} label="Cash on Delivery (COD)" />
              <FormControlLabel control={<Switch checked={payment.card}         onChange={e => setPayment(p => ({ ...p, card: e.target.checked }))}         color="primary" />} label="Credit / Debit Card" />
              <FormControlLabel control={<Switch checked={payment.bankTransfer} onChange={e => setPayment(p => ({ ...p, bankTransfer: e.target.checked }))} color="primary" />} label="Bank Transfer" />
            </Stack>
            <Divider sx={{ my: 2.5 }} />
            <SectionLabel>Order Limits</SectionLabel>
            <TextField
              label="Minimum Order Amount"
              type="number"
              value={payment.minOrder}
              onChange={e => setPayment(p => ({ ...p, minOrder: e.target.value }))}
              size="small"
              sx={{ width: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
            />
          </TabPanel>

          {/* ── Shipping ──────────────────────────────────────── */}
          <TabPanel value={tab} index={3}>
            <SectionLabel>Shipping Rates</SectionLabel>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Free Shipping Threshold" type="number"
                  value={shipping.freeThreshold}
                  onChange={e => setShipping(s => ({ ...s, freeThreshold: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
                  helperText="Orders above this amount get free shipping"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Standard Fee" type="number"
                  value={shipping.standardFee}
                  onChange={e => setShipping(s => ({ ...s, standardFee: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Express Fee" type="number"
                  value={shipping.expressFee}
                  onChange={e => setShipping(s => ({ ...s, expressFee: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={shipping.sameDay} onChange={e => setShipping(s => ({ ...s, sameDay: e.target.checked }))} color="primary" />} label="Enable Same-Day Delivery" />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Delivery Zones ────────────────────────────────── */}
          <TabPanel value={tab} index={4}>
            {deliveryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                <SectionLabel>Delivery Restriction</SectionLabel>
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={delivery.enableInternationalDelivery}
                        onChange={e => setDelivery(d => ({ ...d, enableInternationalDelivery: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label="Enable International Delivery (allow all countries)"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                    When off, only the countries listed below can place orders.
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />
                <SectionLabel>Supported Countries</SectionLabel>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {delivery.supportedCountryCodes.map((code, i) => (
                    <Chip
                      key={code}
                      label={`${delivery.supportedCountryNames[i]} (${code})`}
                      onDelete={delivery.supportedCountryCodes.length > 1 ? () => removeCountry(i) : undefined}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Quick add GCC countries:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {COUNTRY_PRESETS.map(p => (
                    <Chip
                      key={p.code}
                      label={p.name}
                      onClick={() => addPreset(p)}
                      disabled={delivery.supportedCountryCodes.includes(p.code)}
                      variant="outlined"
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>

                <Grid container spacing={1.5} alignItems="flex-end" sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth size="small" label="Country Code (e.g. SA)"
                      value={newCountryCode}
                      onChange={e => setNewCountryCode(e.target.value.toUpperCase())}
                      inputProps={{ maxLength: 3 }}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth size="small" label="Country Name (e.g. Saudi Arabia)"
                      value={newCountryName}
                      onChange={e => setNewCountryName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button fullWidth variant="outlined" onClick={addCountry} disabled={!newCountryCode || !newCountryName}>
                      Add
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />
                <SectionLabel>Restriction Message</SectionLabel>
                <TextField
                  fullWidth multiline rows={2}
                  label="Message shown to customers outside delivery zones"
                  value={delivery.restrictionMessage}
                  onChange={e => setDelivery(d => ({ ...d, restrictionMessage: e.target.value }))}
                  helperText="Displayed on cart, product pages, and checkout when delivery is unavailable."
                />
              </>
            )}
          </TabPanel>

          <Divider sx={{ mt: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            {tab === 4 ? (
              <Button
                variant="contained"
                startIcon={deliverySaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={saveDelivery}
                disabled={deliverySaving}
                sx={{ minWidth: 160 }}
              >
                {deliverySaving ? 'Saving…' : 'Save Delivery Settings'}
              </Button>
            ) : (
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ minWidth: 140 }}>
                Save Settings
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
