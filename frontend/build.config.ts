/**
 * Build configuration for different environments
 */

export interface BuildConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  enableDevtools: boolean;
  enablePerformanceMonitoring: boolean;
  cacheVersion: string;
  minify: boolean;
  sourcemap: boolean;
  dropConsole: boolean;
}

export const buildConfigs: Record<string, BuildConfig> = {
  development: {
    apiBaseUrl: 'http://localhost:8000',
    apiTimeout: 10000,
    enableDevtools: true,
    enablePerformanceMonitoring: false,
    cacheVersion: 'dev',
    minify: false,
    sourcemap: true,
    dropConsole: false
  },
  
  production: {
    apiBaseUrl: '/api',
    apiTimeout: 15000,
    enableDevtools: false,
    enablePerformanceMonitoring: true,
    cacheVersion: '1.0.0',
    minify: true,
    sourcemap: true,
    dropConsole: true
  },
  
  staging: {
    apiBaseUrl: '/api',
    apiTimeout: 12000,
    enableDevtools: false,
    enablePerformanceMonitoring: true,
    cacheVersion: 'staging',
    minify: true,
    sourcemap: true,
    dropConsole: false
  }
};

export const getBuildConfig = (mode: string = 'production'): BuildConfig => {
  return buildConfigs[mode] || buildConfigs.production;
};