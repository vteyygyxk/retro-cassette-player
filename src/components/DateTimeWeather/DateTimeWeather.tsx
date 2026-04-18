/**
 * DateTimeWeather Component - Displays current date, time and weather
 * Shows in the top-left corner of the player
 */

import { useState, useEffect, useCallback } from 'react';
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

// Weather icon mapping based on weather description
function getWeatherIcon(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('晴') || desc.includes('clear') || desc.includes('sunny')) return '☀️';
  if (desc.includes('云') || desc.includes('cloud') || desc.includes('overcast')) return '☁️';
  if (desc.includes('雨') || desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
  if (desc.includes('雷') || desc.includes('thunder') || desc.includes('storm')) return '⛈️';
  if (desc.includes('雪') || desc.includes('snow')) return '❄️';
  if (desc.includes('雾') || desc.includes('fog') || desc.includes('mist')) return '🌫️';
  if (desc.includes('阴')) return '⛅';
  return '🌤️';
}

export function DateTimeWeather() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  // Update time every 100ms for smooth colon blink effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(false);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;

              // Fetch Chinese location name using Nominatim
              fetchLocationName(latitude, longitude);

              // Use wttr.in API with Chinese language (free, no API key required)
              const response = await fetch(
                `https://wttr.in/?format=j1&lang=zh&lat=${latitude}&lon=${longitude}`
              );
              if (response.ok) {
                const data = await response.json();
                const current = data.current_condition[0];

                setWeather({
                  temperature: current.temp_C,
                  description: current.lang_zh && current.lang_zh[0]
                    ? current.lang_zh[0].value
                    : current.weatherDesc[0].value,
                  location: locationInfo?.city || '',
                  humidity: current.humidity,
                  windSpeed: current.windspeedKmph,
                });
              }
              setWeatherLoading(false);
            } catch {
              // Fallback to default location
              await fetchDefaultWeather();
            }
          },
          async () => {
            // Geolocation denied or unavailable, use default location
            await fetchDefaultWeather();
          },
          { timeout: 5000 }
        );
      } else {
        await fetchDefaultWeather();
      }
    } catch {
      setWeatherError(true);
      setWeatherLoading(false);
    }
  }, [locationInfo?.city]);

  // Fetch Chinese location name using Nominatim (OpenStreetMap)
  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh`,
        {
          headers: {
            'Accept-Language': 'zh-CN,zh',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        // Try to get the most specific city/county name
        const city = address.city || address.town || address.county || address.state || '';
        const country = address.country || '';
        setLocationInfo({ city, country });

        // Update weather location if we already have weather data
        if (weather && city) {
          setWeather(prev => prev ? { ...prev, location: city } : prev);
        }
      }
    } catch {
      // Silently fail, location is optional
    }
  };

  // Fetch weather for default location (Beijing)
  const fetchDefaultWeather = async () => {
    try {
      const response = await fetch('https://wttr.in/?format=j1&lang=zh');
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition[0];

        setLocationInfo({ city: '北京', country: '中国' });

        setWeather({
          temperature: current.temp_C,
          description: current.lang_zh && current.lang_zh[0]
            ? current.lang_zh[0].value
            : current.weatherDesc[0].value,
          location: '北京',
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

  // Initial weather fetch
  useEffect(() => {
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Format date
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekDay}`;
  };

  // Format time with blinking colon effect
  const formatTime = (date: Date): React.ReactNode => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const showColon = date.getMilliseconds() < 500;

    return (
      <>
        {hours}
        <span style={{ opacity: showColon ? 1 : 0.3 }}>:</span>
        {minutes}
        <span style={{ opacity: showColon ? 1 : 0.3 }}>:</span>
        {seconds}
      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* Date & Time Panel */}
      <div className={styles.dateTimeSection}>
        <div className={styles.date}>{formatDate(currentTime)}</div>
        <div className={styles.time}>{formatTime(currentTime)}</div>
      </div>

      {/* Weather Panel */}
      <div className={styles.weatherSection}>
        {weatherLoading ? (
          <div className={styles.weatherLoading}>
            <span className={styles.loadingIcon}>⟳</span>
            <span>获取天气...</span>
          </div>
        ) : weatherError ? (
          <div className={styles.weatherError}>
            <span>天气加载失败</span>
            <button
              className={styles.retryBtn}
              onClick={fetchWeather}
              title="重试"
            >
              ↻
            </button>
          </div>
        ) : weather ? (
          <div className={styles.weatherContent}>
            <div className={styles.weatherMain}>
              <span className={styles.weatherIcon}>{getWeatherIcon(weather.description)}</span>
              <span className={styles.temperature}>{weather.temperature}°</span>
            </div>
            <div className={styles.weatherDetails}>
              {locationInfo?.city && (
                <span className={styles.location}>{locationInfo.city}</span>
              )}
              <span className={styles.description}>{weather.description}</span>
              {weather.humidity && (
                <span className={styles.humidity}>
                  💧{weather.humidity}%
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
