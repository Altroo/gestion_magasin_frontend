import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

type http = 'http' | 'https' | undefined;

const parseUrl = (value?: string) => {
	if (!value) return null;
	try {
		return new URL(value);
	} catch {
		return null;
	}
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const apiUrls = unique([
	process.env.NEXT_PUBLIC_API_URL ?? '',
	process.env.NEXT_PUBLIC_BACKEND_API ?? '',
	process.env.NEXT_PUBLIC_ROOT_API_URL ?? '',
]);

const apiOrigins = unique(apiUrls.map((value) => parseUrl(value)?.origin ?? ''));

const remotePatterns: RemotePattern[] = unique(
	apiUrls.map((value) => {
		const parsed = parseUrl(value);
		return parsed ? parsed.origin : '';
	}),
).flatMap((origin) => {
	const parsed = parseUrl(origin);
	if (!parsed) return [];
	return [{
		protocol: parsed.protocol.replace(':', '') as http,
		hostname: parsed.hostname,
		port: parsed.port,
		pathname: '/media/**',
		search: '',
	}];
});

if (isDev && process.env.NEXT_PUBLIC_API_ROOT_URL) {
	const port = process.env.NEXT_PUBLIC_API_ROOT_PORT;
	const shouldIncludePort = port && port !== '80' && port !== '443';

	remotePatterns.push({
		protocol: process.env.NEXT_PUBLIC_HTTP_PROTOCOLE as http,
		hostname: process.env.NEXT_PUBLIC_API_ROOT_URL as string,
		...(shouldIncludePort && { port }),
		pathname: '/media/**',
	});
}

const wsOrigin = parseUrl(process.env.NEXT_PUBLIC_ROOT_WS_URL)?.origin ?? '';
const cspImageSources = unique(apiOrigins);
const cspConnectSources = unique([...apiOrigins, wsOrigin]);

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: true,
	poweredByHeader: false,
	compress: false,
	typedRoutes: true,

	experimental: {
		typedEnv: true,
		turbopackFileSystemCacheForDev: true,
		optimizeCss: isProd,
	},

	sassOptions: {
		includePaths: [path.join(__dirname, 'src', 'styles'), path.join(__dirname, 'public')],
	},

	images: {
		unoptimized: isDev,
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		minimumCacheTTL: 60,
		remotePatterns,
		dangerouslyAllowLocalIP: isProd,
	},

	async headers() {
		return [
			...(isProd ? [{
				source: '/_next/static/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			}] : []),
			{
				source: '/assets/ico/manifest.json',
				headers: [
					{ key: 'Content-Type', value: 'application/manifest+json' },
					{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
				],
			},
			{
				source: '/assets/fonts/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
				],
			},
			{
				source: '/assets/images/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},
			{
				source: '/assets/ico/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},
			{
				source: '/assets/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
				],
			},
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'X-XSS-Protection', value: '1; mode=block' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"font-src 'self' https://fonts.gstatic.com data:",
							`img-src 'self' ${cspImageSources.join(' ')} data: blob:`,
							`connect-src 'self' ${cspConnectSources.join(' ')}`,

							"frame-ancestors 'self'",
							"base-uri 'self'",
							"form-action 'self'",
						].join('; '),
					},
				],
			},
		];
	},
};

export default nextConfig;
