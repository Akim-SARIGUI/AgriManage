import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  WeatherDayDto,
  WeatherForecastDto,
  WeatherLocationDto,
} from '@agrimanage/shared';

const WEATHER_LABELS: Record<number, string> = {
  0: 'Ciel clair',
  1: 'Plutôt clair',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine',
  55: 'Bruine dense',
  61: 'Pluie faible',
  63: 'Pluie',
  65: 'Pluie forte',
  71: 'Neige faible',
  73: 'Neige',
  75: 'Neige forte',
  80: 'Averses faibles',
  81: 'Averses',
  82: 'Averses fortes',
  95: 'Orage',
  96: 'Orage avec grêle',
  99: 'Orage violent',
};

@Injectable()
export class WeatherService {
  async getForecast(
    latitude: number,
    longitude: number,
    locationName?: string,
  ): Promise<WeatherForecastDto> {
    this.assertCoordinates(latitude, longitude);

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set(
      'daily',
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const data = await this.fetchJson<{
      latitude: number;
      longitude: number;
      timezone: string;
      daily: {
        time: string[];
        weathercode: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        windspeed_10m_max: number[];
      };
    }>(url);

    const days: WeatherDayDto[] = data.daily.time.map((date, index) => {
      const code = data.daily.weathercode[index] ?? 0;
      return {
        date,
        weatherCode: code,
        weatherLabel: WEATHER_LABELS[code] ?? `Code ${code}`,
        tempMax: data.daily.temperature_2m_max[index] ?? 0,
        tempMin: data.daily.temperature_2m_min[index] ?? 0,
        precipitation: data.daily.precipitation_sum[index] ?? 0,
        windSpeedMax: data.daily.windspeed_10m_max[index] ?? null,
      };
    });

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      locationName,
      days,
    };
  }

  async searchLocations(query: string): Promise<WeatherLocationDto[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Saisissez au moins 2 caractères');
    }

    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'fr');
    url.searchParams.set('format', 'json');

    const data = await this.fetchJson<{
      results?: Array<{
        id: number;
        name: string;
        country: string;
        admin1?: string;
        latitude: number;
        longitude: number;
      }>;
    }>(url);

    return (data.results ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country,
      admin1: item.admin1 ?? null,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  }

  private assertCoordinates(latitude: number, longitude: number) {
    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('Coordonnées invalides');
    }
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new ServiceUnavailableException('Service météo indisponible');
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException('Impossible de contacter le service météo');
    }
  }
}
