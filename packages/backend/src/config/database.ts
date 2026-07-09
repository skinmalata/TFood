import knex from 'knex';
import { config } from './env';
import { knexConfig } from './knexfile';

const env = config.NODE_ENV === 'production' ? 'production' : 'development';
const db = knex(knexConfig[env]);

export default db;
