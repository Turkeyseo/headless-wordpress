import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import fs from 'fs';
import path from 'path';

// Resolve the WordPress hostname from env or the saved site-config so the
// image optimizer can be scoped to it (instead of proxying *any* host).
function getWordPressHost(): string | null {
  let url = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;

  if (!url) {
    try {
      const cfgPath = path.join(process.cwd(), 'site-config.json');
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
        url = cfg.wordpressUrl;
      }
    } catch {
      // ignore – fall through to permissive mode below
    }
  }

  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function rootDomain(host: string): string {
  const parts = host.split('.');
  return parts.length <= 2 ? host : parts.slice(-2).join('.');
}

function buildRemotePatterns(): RemotePattern[] {
  const wpHost = getWordPressHost();

  // No known WordPress host (fresh install / local demo): stay permissive so
  // nothing breaks. Lock this down by setting WORDPRESS_URL (or add hosts via
  // NEXT_PUBLIC_IMAGE_HOSTS) once the site is configured.
  if (!wpHost) {
    return [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ];
  }

  const hosts = new Set<string>([
    wpHost,
    `**.${rootDomain(wpHost)}`, // CDN / media subdomains of the same domain
    'secure.gravatar.com',
    '**.gravatar.com',
    'images.unsplash.com', // used by the bundled default homepage sections
  ]);

  // Allow operators to whitelist additional image hosts.
  (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((h) => hosts.add(h));

  const patterns: RemotePattern[] = [];
  for (const hostname of hosts) {
    patterns.push({ protocol: 'https', hostname });
    patterns.push({ protocol: 'http', hostname });
  }
  return patterns;
}

// Restrict server-action origins in production via env (comma-separated).
// Omitting it keeps Next's secure same-origin default.
const serverActionOrigins = (process.env.SERVER_ACTION_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildRemotePatterns(),
  },

  experimental: {
    ...(serverActionOrigins.length
      ? { serverActions: { allowedOrigins: serverActionOrigins } }
      : {}),
  },
};

export default nextConfig;
