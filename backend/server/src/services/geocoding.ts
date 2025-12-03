/**
 * Reverse geocode coordinates to a human-readable place name using
 * OpenStreetMap's Nominatim service.
 *
 * Note: In production, you should provide a proper User-Agent identifying your app.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  if (
    typeof latitude !== 'number' || Number.isNaN(latitude) ||
    typeof longitude !== 'number' || Number.isNaN(longitude)
  ) {
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=14&addressdetails=1`;

  const headers: Record<string, string> = {
    'User-Agent': 'CampusMarketplace/1.0 (+https://example.com)',
    'Accept': 'application/json',
  };

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return null;
    }
    const data = await res.json().catch(() => null) as any;
    if (!data) return null;

    // Build a short 2-part label, preferring neighbourhood/suburb + city
    const address = data.address || {};
    const cityLike =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality ||
      address.city_district;
    const hoodLike =
      address.neighbourhood || // OSM spelling
      address.neighborhood ||  // alt spelling just in case
      address.suburb ||
      address.quarter ||
      address.borough ||
      address.district;

    // If we have both, return "Hood, City"
    if (hoodLike && cityLike) {
      return `${hoodLike}, ${cityLike}`;
    }

    // Otherwise, try "City, State" as a concise fallback
    const stateLike = address.state || address.region;
    if (cityLike && stateLike) {
      return `${cityLike}, ${stateLike}`;
    }

    // Final fallback: take the first two parts of display_name
    const displayName: string | undefined = data.display_name;
    if (displayName && typeof displayName === 'string') {
      const parts = displayName.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}, ${parts[1]}`;
      }
      if (parts.length === 1) {
        return parts[0];
      }
    }

    // If nothing else, return a coarse composed string
    const composed =
      [cityLike, stateLike, address.country]
        .filter(Boolean)
        .join(', ');
    return composed || null;
  } catch {
    return null;
  }
}


