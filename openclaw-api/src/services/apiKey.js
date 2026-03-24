import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '../config.js';

const BCRYPT_ROUNDS = 10;

export function generateApiKey() {
  const random = crypto.randomBytes(24).toString('base64url').slice(0, config.apiKeyLength);
  return `${config.apiKeyPrefix}${random}`;
}

export async function hashApiKey(key) {
  return bcrypt.hash(key, BCRYPT_ROUNDS);
}

export async function verifyApiKey(key, hash) {
  return bcrypt.compare(key, hash);
}

export function getKeyPrefix(key) {
  // First 8 chars including prefix e.g. "oc_a1b2"
  return key.slice(0, 8);
}
