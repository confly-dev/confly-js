import { join } from 'path';
import { existsSync } from 'fs';

export function getCachePath() {
  return join(process.cwd(), '.confly.cache');
}

export function getEndpoint() {
  return existsSync(join(process.cwd(), '/.dev')) ? 'http://localhost:3000/' : 'https://confly.dev/';
}
