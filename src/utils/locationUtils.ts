export interface Location {
  latitude: number;
  longitude: number;
}

// Demo venue location (simulated university campus)
export const VENUE_LOCATION: Location = {
  latitude: 28.49985140095136,
  longitude: 77.51992844777615
};

export const ALLOWED_RADIUS = 100; // meters

export function calculateDistance(pos1: Location, pos2: Location): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = pos1.latitude * Math.PI/180;
  const φ2 = pos2.latitude * Math.PI/180;
  const Δφ = (pos2.latitude-pos1.latitude) * Math.PI/180;
  const Δλ = (pos2.longitude-pos1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export function validateLocation(userLocation: Location): {
  isValid: boolean;
  distance: number;
  message: string;
} {
  const distance = calculateDistance(userLocation, VENUE_LOCATION);
  const isValid = distance <= ALLOWED_RADIUS;
  
  return {
    isValid,
    distance: Math.round(distance),
    message: isValid 
      ? `Location verified (${Math.round(distance)}m from venue)`
      : `You are ${Math.round(distance)}m from the venue. Please move closer to mark attendance.`
  };
}

export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // For demo purposes, simulate being near the venue
        console.warn('Location access denied, using demo location:', error.message);
        resolve({
          latitude: VENUE_LOCATION.latitude + (Math.random() - 0.5) * 0.001,
          longitude: VENUE_LOCATION.longitude + (Math.random() - 0.5) * 0.001,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}
