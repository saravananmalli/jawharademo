import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'jawhara_delivery_location';
const DEFAULT_LOCATION = { city: 'Dubai', country: 'UAE', countryCode: 'AE', display: 'Dubai' };

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      { headers: { 'User-Agent': 'JawharaJewelry/1.0' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.county || 'Dubai';
    const countryCode = addr.country_code?.toUpperCase() || '';
    const isUAE = countryCode === 'AE';
    const country = isUAE ? 'UAE' : (addr.country || '');
    return { city, country, countryCode, display: city };
  } catch {
    return null;
  }
}

export function useDeliveryLocation() {
  const [location, setLocationState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [detecting, setDetecting] = useState(false);
  const hasStoredRef = useRef(!!location);

  const saveLocation = useCallback((loc) => {
    setLocationState(loc);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch {}
  }, []);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      saveLocation(DEFAULT_LOCATION);
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const loc = await reverseGeocode(coords.latitude, coords.longitude);
        saveLocation(loc || DEFAULT_LOCATION);
        setDetecting(false);
      },
      () => {
        saveLocation(DEFAULT_LOCATION);
        setDetecting(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [saveLocation]);

  // Auto-detect on first visit (no stored location)
  useEffect(() => {
    if (!hasStoredRef.current) detect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    location: location || DEFAULT_LOCATION,
    detecting,
    saveLocation,
    detect,
  };
}
