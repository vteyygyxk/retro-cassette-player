/**
 * DateTimeWeather Component - Displays current date, time and weather
 * Shows in the top-left corner of the player with dynamic weather effects
 */

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import type { ReactNode } from 'react';
import styles from './DateTimeWeather.module.css';

interface WeatherData {
  temperature: string;
  description: string;
  location: string;
  humidity?: string;
  windSpeed?: string;
}

interface LocationInfo {
  city: string;
  country: string;
}

type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' | 'partlyCloudy';

// Get weather type from description
function getWeatherType(description: string): WeatherType {
  const desc = description.toLowerCase();
  if (desc.includes('雷') || desc.includes('thunder') || desc.includes('storm')) return 'stormy';
  if (desc.includes('雨') || desc.includes('rain') || desc.includes('drizzle')) return 'rainy';
  if (desc.includes('雪') || desc.includes('snow')) return 'snowy';
  if (desc.includes('雾') || desc.includes('fog') || desc.includes('mist') || desc.includes('霾')) return 'foggy';
  if (desc.includes('晴') || desc.includes('clear') || desc.includes('sunny')) return 'sunny';
  if (desc.includes('阴') || desc.includes('overcast')) return 'cloudy';
  if (desc.includes('云') || desc.includes('cloud')) return 'partlyCloudy';
  return 'partlyCloudy';
}

// Weather icon mapping
function getWeatherIcon(type: WeatherType): string {
  const icons: Record<WeatherType, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    stormy: '⛈️',
    foggy: '🌫️',
    partlyCloudy: '⛅',
  };
  return icons[type];
}

// ============================================================================
// Dynamic Weather Effects
// ============================================================================

// Sunny effect - animated sun rays
const SunnyEffect = memo(() => (
  <div className={styles.sunnyEffect}>
    <div className={styles.sunCore} />
    <div className={styles.sunRays}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={styles.sunRay}
          style={{ transform: `rotate(${i * 45}deg)` }}
        />
      ))}
    </div>
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className={styles.sunParticle}
        style={{
          left: `${15 + Math.random() * 70}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      />
    ))}
  </div>
));

// Rain effect - falling raindrops
const RainEffect = memo(() => (
  <div className={styles.rainEffect}>
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className={styles.raindrop}
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 1}s`,
          animationDuration: `${0.5 + Math.random() * 0.3}s`,
          opacity: 0.3 + Math.random() * 0.4,
        }}
      />
    ))}
  </div>
));

// Snow effect - falling snowflakes
const SnowEffect = memo(() => (
  <div className={styles.snowEffect}>
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className={styles.snowflake}
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2}s`,
          width: `${4 + Math.random() * 4}px`,
          height: `${4 + Math.random() * 4}px`,
        }}
      />
    ))}
  </div>
));

// Cloud effect - floating clouds
const CloudEffect = memo(({ dark = false }: { dark?: boolean }) => (
  <div className={`${styles.cloudEffect} ${dark ? styles.darkClouds : ''}`}>
    <div className={styles.cloud} style={{ top: '10%', animationDelay: '0s' }} />
    <div className={styles.cloud} style={{ top: '30%', animationDelay: '-5s', transform: 'scale(0.8)' }} />
    <div className={styles.cloud} style={{ top: '50%', animationDelay: '-10s', transform: 'scale(0.6)' }} />
  </div>
));

// Storm effect - lightning and rain
const StormEffect = memo(() => (
  <div className={styles.stormEffect}>
    <RainEffect />
    <div className={styles.lightningContainer}>
      <div className={styles.lightning} />
    </div>
  </div>
));

// Fog effect - moving mist
const FogEffect = memo(() => (
  <div className={styles.fogEffect}>
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className={styles.fogLayer}
        style={{
          animationDelay: `${i * -4}s`,
          opacity: 0.3 - i * 0.05,
        }}
      />
    ))}
  </div>
));

// Partly Cloudy effect - sun with small clouds
const PartlyCloudyEffect = memo(() => (
  <div className={styles.partlyCloudyEffect}>
    <div className={styles.smallSun} />
    <div className={styles.smallCloud} style={{ top: '20%', left: '30%' }} />
    <div className={styles.smallCloud} style={{ top: '50%', left: '50%', transform: 'scale(0.7)' }} />
  </div>
));

// ============================================================================
// Main Component
// ============================================================================

// 缓存位置信息的键名
const LOCATION_CACHE_KEY = 'retro-player-location-cache';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CachedLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
  timestamp: number;
}

function getCachedLocation(): CachedLocation | null {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as CachedLocation;
      if (Date.now() - data.timestamp < LOCATION_CACHE_DURATION) {
        return data;
      }
    }
  } catch {}
  return null;
}

function saveCachedLocation(lat: number, lon: number, city: string, country: string) {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
      lat, lon, city, country, timestamp: Date.now(),
    }));
  } catch {}
}

export function DateTimeWeather() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const locationRef = useRef<LocationInfo | null>(null);

  // Get weather type for dynamic effects
  const weatherType = useMemo<WeatherType>(() => {
    return weather ? getWeatherType(weather.description) : 'partlyCloudy';
  }, [weather]);

  // Update time every 100ms
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 100);
    return () => clearInterval(timer);
  }, []);

  const fetchLocationName = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh`,
        { headers: { 'Accept-Language': 'zh-CN,zh' } }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const city = address.city || address.town || address.county || address.state || '';
        const country = address.country || '';
        const info = { city, country };
        locationRef.current = info;
        setLocationInfo(info);
        if (city) saveCachedLocation(lat, lon, city, country);
        return city;
      }
    } catch {}
    return '';
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number, cityName?: string) => {
    try {
      const response = await fetch(`https://wttr.in/?format=j1&lang=zh&lat=${lat}&lon=${lon}`);
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition[0];
        const locationName = cityName || locationRef.current?.city || '';
        setWeather({
          temperature: current.temp_C,
          description: current.lang_zh?.[0]?.value || current.weatherDesc[0].value,
          location: locationName,
          humidity: current.humidity,
          windSpeed: current.windspeedKmph,
        });
      }
      setWeatherLoading(false);
    } catch {
      throw new Error('Weather fetch failed');
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(false);

      const cachedLocation = getCachedLocation();
      if (cachedLocation) {
        const info = { city: cachedLocation.city, country: cachedLocation.country };
        locationRef.current = info;
        setLocationInfo(info);
        try {
          await fetchWeatherByCoords(cachedLocation.lat, cachedLocation.lon, cachedLocation.city);
          return;
        } catch {}
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const cityName = await fetchLocationName(latitude, longitude);
              await fetchWeatherByCoords(latitude, longitude, cityName);
            } catch {
              await fetchFallbackWeather();
            }
          },
          async () => {
            await fetchFallbackWeather();
          },
          { timeout: 8000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false }
        );
      } else {
        await fetchFallbackWeather();
      }
    } catch {
      setWeatherError(true);
      setWeatherLoading(false);
    }
  }, [fetchLocationName, fetchWeatherByCoords]);

  const fetchFallbackWeather = async () => {
    try {
      const response = await fetch('https://wttr.in/?format=j1&lang=zh');
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition[0];
        const nearestArea = data.nearest_area?.[0];
        const cityName = nearestArea?.areaName?.[0]?.value || '';
        const info = { city: cityName, country: nearestArea?.country?.[0]?.value || '' };
        locationRef.current = info;
        setLocationInfo(info);
        setWeather({
          temperature: current.temp_C,
          description: current.lang_zh?.[0]?.value || current.weatherDesc[0].value,
          location: cityName,
          humidity: current.humidity,
          windSpeed: current.windspeedKmph,
        });
      }
      setWeatherLoading(false);
    } catch {
      setWeatherError(true);
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 · ${weekDays[date.getDay()]}`;
  };

  const formatTime = (date: Date): ReactNode => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const showColon = date.getMilliseconds() < 500;
    return (
      <>
        <span>{hours}</span>
        <span style={{ opacity: showColon ? 1 : 0.4 }}>:</span>
        <span>{minutes}</span>
      </>
    );
  };

  // Render weather effect based on type
  const renderWeatherEffect = () => {
    switch (weatherType) {
      case 'sunny':
        return <SunnyEffect />;
      case 'rainy':
        return <RainEffect />;
      case 'snowy':
        return <SnowEffect />;
      case 'cloudy':
        return <CloudEffect dark />;
      case 'stormy':
        return <StormEffect />;
      case 'foggy':
        return <FogEffect />;
      case 'partlyCloudy':
        return <PartlyCloudyEffect />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Date & Time Panel */}
      <div className={styles.dateTimeSection}>
        <div className={styles.date}>{formatDate(currentTime)}</div>
        <div className={styles.time}>{formatTime(currentTime)}</div>
      </div>

      {/* Weather Panel */}
      <div className={`${styles.weatherSection} ${styles[weatherType]}`}>
        {renderWeatherEffect()}
        {weatherLoading ? (
          <div className={styles.weatherLoading}>
            <span className={styles.loadingIcon}>⟳</span>
            <span>获取天气...</span>
          </div>
        ) : weatherError ? (
          <div className={styles.weatherError}>
            <span>天气加载失败</span>
            <button className={styles.retryBtn} onClick={fetchWeather} title="重试">↻</button>
          </div>
        ) : weather ? (
          <div className={styles.weatherContent}>
            <div className={styles.weatherMain}>
              <span className={styles.weatherIcon}>{getWeatherIcon(weatherType)}</span>
              <span className={styles.temperature}>{weather.temperature}°</span>
            </div>
            <div className={styles.weatherDetails}>
              {locationInfo?.city && (
                <span className={styles.location}>{locationInfo.city}</span>
              )}
              <span className={styles.description}>{weather.description}</span>
              {weather.humidity && (
                <span className={styles.humidity}>💧{weather.humidity}%</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
