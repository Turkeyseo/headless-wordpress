// Central authentication module (server-only).
//
// Provides:
//  - Password hashing with salted scrypt (+ transparent upgrade from the
//    legacy unsalted SHA-256 hashes used by older installs).
//  - Stateless, HMAC-signed session tokens (tamper-proof, with expiry).
//  - Guards used by server actions / route handlers / server components.
//
// NOTE: This file imports `config` (which uses `fs`) and `next/headers`,
// so it must only ever be used on the server.

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { getSiteConfig } from './config';

export const SESSION_COOKIE = 'manager_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SCRYPT_KEYLEN = 64;

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/** Hash a password with a random salt using scrypt. Format: `scrypt:salt:hash`. */
export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
    return `scrypt:${salt}:${derived}`;
}

/**
 * Verify a password against a stored hash.
 * Supports both the new `scrypt:salt:hash` format and the legacy unsalted
 * SHA-256 hex digest. When a legacy hash matches, `needsUpgrade` is true so
 * the caller can re-hash and persist the stronger form.
 */
export function verifyPassword(
    password: string,
    stored: string | undefined
): { valid: boolean; needsUpgrade: boolean } {
    if (!stored) return { valid: false, needsUpgrade: false };

    if (stored.startsWith('scrypt:')) {
        const [, salt, hashHex] = stored.split(':');
        if (!salt || !hashHex) return { valid: false, needsUpgrade: false };
        const expected = Buffer.from(hashHex, 'hex');
        const derived = scryptSync(password, salt, expected.length || SCRYPT_KEYLEN);
        const valid = expected.length === derived.length && timingSafeEqual(expected, derived);
        return { valid, needsUpgrade: false };
    }

    // Legacy: unsalted single-round SHA-256 hex digest.
    const legacy = createHash('sha256').update(password).digest('hex');
    const a = Buffer.from(legacy);
    const b = Buffer.from(stored);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    return { valid, needsUpgrade: valid };
}

// ---------------------------------------------------------------------------
// Session tokens (stateless, HMAC-signed)
// ---------------------------------------------------------------------------

/** Generate a fresh random session secret (store this in config.auth.sessionSecret). */
export function generateSessionSecret(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Resolve the secret used to sign/verify sessions, in priority order:
 *  1. SESSION_SECRET env var (recommended for production / multi-instance)
 *  2. The per-site secret persisted in config.auth.sessionSecret
 *  3. A value derived from the password hash (fallback for installs that
 *     predate sessionSecret — changing the password then invalidates sessions)
 * Returns null when no auth is configured at all (no valid session possible).
 */
function resolveSessionSecret(): string | null {
    const envSecret = process.env.SESSION_SECRET;
    if (envSecret && envSecret.length >= 16) return envSecret;

    const config = getSiteConfig();
    if (config.auth?.sessionSecret) return config.auth.sessionSecret;
    if (config.auth?.passwordHash) return `derived:${config.auth.passwordHash}`;
    return null;
}

/** Create a signed session token for the given username. */
export function createSessionToken(username: string): string | null {
    const secret = resolveSessionSecret();
    if (!secret) return null;

    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    const payload = `${encodeURIComponent(username)}.${expiresAt}`;
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const sig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    return `${payloadB64}.${sig}`;
}

/** Verify a signed session token. Returns the username or null if invalid/expired. */
export function verifySessionToken(token: string | undefined): { username: string } | null {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;

    const secret = resolveSessionSecret();
    if (!secret) return null;

    const expectedSig = createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    let payload: string;
    try {
        payload = Buffer.from(payloadB64, 'base64url').toString();
    } catch {
        return null;
    }

    const sep = payload.lastIndexOf('.');
    if (sep === -1) return null;
    const username = decodeURIComponent(payload.slice(0, sep));
    const expiresAt = Number(payload.slice(sep + 1));
    if (!expiresAt || Date.now() > expiresAt) return null;

    return { username };
}

// ---------------------------------------------------------------------------
// Cookie helpers + guards
// ---------------------------------------------------------------------------

/** Issue a session cookie for the given user. */
export async function setSessionCookie(username: string): Promise<void> {
    const token = createSessionToken(username);
    if (!token) return;
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    });
}

/** Clear the session cookie (logout). */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

/** Return the authenticated manager username from the request cookies, or null. */
export async function getSessionUser(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    return verifySessionToken(token)?.username ?? null;
}

/**
 * True when the request may use the manager. If no auth is configured yet
 * (fresh install, pre-setup) access is open; otherwise a valid signed session
 * is required.
 */
export async function isManagerAuthenticated(): Promise<boolean> {
    const config = getSiteConfig();
    if (!config.auth) return true;
    return (await getSessionUser()) !== null;
}

/** Throw `Unauthorized` unless the request is allowed to use the manager. */
export async function requireManagerAuth(): Promise<void> {
    if (!(await isManagerAuthenticated())) {
        throw new Error('Unauthorized');
    }
}
