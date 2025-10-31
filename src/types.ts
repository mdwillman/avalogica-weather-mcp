/**
 * Type definitions for Avalogica Weather MCP
 */

/**
 * Structure of the Open-Meteo daily forecast response
 */
export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

/**
 * Structure of the overall forecast API response
 */
export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  timezone: string;
  daily_units: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
  };
  daily: DailyForecast;
}

/**
 * Arguments expected by the get_forecast tool
 */
export interface GetForecastArgs {
  latitude: number;
  longitude: number;
  days?: number;
}