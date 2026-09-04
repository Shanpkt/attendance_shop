export const SETTINGS_API =
  "https://attendance-backend-hs75.onrender.com/api/settings";

export const DEFAULT_GEOFENCE_METERS = 100;

export const MAX_GPS_ACCURACY_METERS = 120;

export const getDistanceInMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const toRad = (value) =>
    (Number(value) * Math.PI) / 180;

  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return (
    2 *
    earthRadius *
    Math.asin(Math.sqrt(a))
  );
};

export const getGeofenceRadius = () => {
  return DEFAULT_GEOFENCE_METERS;
};
