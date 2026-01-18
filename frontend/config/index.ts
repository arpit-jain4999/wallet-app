/**
 * Environment configuration with validation
 */

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  features: {
    enableCsvExport: boolean;
    enableFilters: boolean;
  };
  env: 'development' | 'production' | 'test';
}

const getConfig = (): Config => {
  const env = (process.env.NODE_ENV || 'development') as Config['env'];

  return {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
    },
    features: {
      enableCsvExport: process.env.NEXT_PUBLIC_ENABLE_CSV_EXPORT !== 'false',
      enableFilters: process.env.NEXT_PUBLIC_ENABLE_FILTERS !== 'false',
    },
    env,
  };
};

export const config = getConfig();

export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
export const isTest = config.env === 'test';
