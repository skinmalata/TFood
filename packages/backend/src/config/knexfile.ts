import path from 'path';
import { config } from './env';

const migrationsDir = path.resolve(__dirname, '../../migrations');
const seedsDir = path.resolve(__dirname, '../../seeds');

const knexConfig = {
  development: {
    client: 'mysql2',
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
    },
    migrations: {
      directory: migrationsDir,
      extension: 'ts',
    },
    seeds: {
      directory: seedsDir,
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
    },
    migrations: {
      directory: migrationsDir,
      extension: 'ts',
    },
    seeds: {
      directory: seedsDir,
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default knexConfig;
export { knexConfig };
