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

/**
 * Supported arguments for the get_tech_update tool
 */
export interface TechUpdateArgs {
  topic: string;
}

/**
 * Citation structure returned by get_tech_update
 */
export interface TechUpdateCitation {
  label: string;
  url: string;
}

/**
 * Structured result returned by get_tech_update
 */
export interface TechUpdateResult {
  content: string;
  citations: TechUpdateCitation[];
  model: string;
  createdAt: string;
  topic: string;
  title: string;
  description: string;
}