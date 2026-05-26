import { createContext, useContext, useState, useEffect } from 'react';
import { useDeliveryLocation } from '../hooks/useDeliveryLocation';
import api from '../services/api';

const DEFAULT_SETTINGS = {
  enableInternationalDelivery: false,
  supportedCountryCodes: ['AE'],
  supportedCountryNames: ['UAE'],
  restrictionMessage: 'Currently we deliver only within UAE. We will expand to more countries soon.',
};

const DeliverySettingsContext = createContext(null);

export function DeliverySettingsProvider({ children }) {
  const { location, detecting, saveLocation, detect } = useDeliveryLocation();
  const [deliverySettings, setDeliverySettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    api.get('/settings/delivery')
      .then(({ data }) => {
        if (data.success && data.data) setDeliverySettings(data.data);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  const isDeliveryAvailable =
    deliverySettings.enableInternationalDelivery ||
    deliverySettings.supportedCountryCodes.includes(location.countryCode || 'AE');

  return (
    <DeliverySettingsContext.Provider value={{
      location,
      detecting,
      saveLocation,
      detect,
      deliverySettings,
      setDeliverySettings,
      settingsLoaded,
      isDeliveryAvailable,
    }}>
      {children}
    </DeliverySettingsContext.Provider>
  );
}

export function useDeliverySettings() {
  const ctx = useContext(DeliverySettingsContext);
  if (!ctx) throw new Error('useDeliverySettings must be used inside DeliverySettingsProvider');
  return ctx;
}
