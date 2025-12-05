import { useEffect, useRef } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  onChange?: (coords: Coordinates) => void;
  className?: string;
  value?: Coordinates | null;
  zoom?: number;
}

const GOOGLE_MAPS_API_KEY =
  (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDmyZ_sJw5q1fGztTGUbjcHQcrGPeccOa4';
const GOOGLE_MAPS_MAP_ID =
  (import.meta as any)?.env?.VITE_GOOGLE_MAPS_MAP_ID || 'a3be8a190a0ca2cc98e12b0f';

const DEFAULT_CENTER: Coordinates = { lat: 37.3352, lng: -121.8811 }; // SJSU
const DEFAULT_ZOOM = 15;

declare global {
  interface Window {
    google?: any;
    __googleMapsScriptLoadingPromise?: Promise<any>;
  }
}

function loadGoogleMapsApi(apiKey: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }
  if (window.__googleMapsScriptLoadingPromise) {
    return window.__googleMapsScriptLoadingPromise;
  }
  window.__googleMapsScriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&v=beta&libraries=maps,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return window.__googleMapsScriptLoadingPromise;
}

function toCoords(pos: any): Coordinates {
  if (!pos) return DEFAULT_CENTER;
  // Handle LatLng object vs literal
  if (typeof pos.lat === 'function' && typeof pos.lng === 'function') {
    return { lat: pos.lat(), lng: pos.lng() };
  }
  return { lat: pos.lat, lng: pos.lng };
}

export default function MapPicker({
  onChange,
  className,
  value = null,
  zoom = DEFAULT_ZOOM,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const clickListenerRef = useRef<any | null>(null);
  const dragEndListenerRef = useRef<any | null>(null);

  // Initialize map once
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const google = await loadGoogleMapsApi(GOOGLE_MAPS_API_KEY);
        if (!mounted || !containerRef.current) return;

        const { Map } = (await google.maps.importLibrary('maps')) as any;
        await google.maps.importLibrary('marker'); // AdvancedMarkerElement

        const mapOptions = {
          center: value ?? DEFAULT_CENTER,
          zoom: value ? Math.max(zoom, 14) : zoom,
          mapId: GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        };

        const map = new Map(containerRef.current, mapOptions);
        mapRef.current = map;

        // Setup click to drop/update pin
        clickListenerRef.current = map.addListener('click', (e: any) => {
          const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          placeOrMoveMarker(google, coords);
          if (typeof onChange === 'function') onChange(coords);
        });

        // If there is an initial value, place marker
        if (value) {
          placeOrMoveMarker(google, value);
        }
      } catch {
        // Fail silently; map won't render if API fails
      }
    })();

    return () => {
      mounted = false;
      // Cleanup listeners and marker
      if (clickListenerRef.current) {
        clickListenerRef.current.remove?.();
        clickListenerRef.current = null;
      }
      if (dragEndListenerRef.current) {
        dragEndListenerRef.current.remove?.();
        dragEndListenerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Respond to external value changes
  useEffect(() => {
    const google = window.google;
    if (!mapRef.current || !google) return;
    if (!value) return;
    placeOrMoveMarker(google, value);
    mapRef.current.setCenter(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  function placeOrMoveMarker(google: any, coords: Coordinates) {
    const map = mapRef.current;
    if (!map) return;

    if (!markerRef.current) {
      const { AdvancedMarkerElement } = google.maps.marker;
      markerRef.current = new AdvancedMarkerElement({
        map,
        position: coords,
        gmpDraggable: true,
      });
      dragEndListenerRef.current = markerRef.current.addListener('dragend', () => {
        const next = toCoords(markerRef.current.position);
        if (typeof onChange === 'function') onChange(next);
      });
    } else {
      markerRef.current.position = coords;
      markerRef.current.map = map;
    }
  }

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}

