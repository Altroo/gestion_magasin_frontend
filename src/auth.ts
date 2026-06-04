import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import z from 'zod';
import { allowAnyInstance } from '@/utils/helpers';
import { postApi } from '@/utils/apiHelpers';
import type { AccountPostLoginResponseType } from '@/types/accountTypes';

const getAuthCookies = (prefix: string) => {
	const secure = process.env.NEXTAUTH_URL?.startsWith('https://') ?? process.env.NODE_ENV === 'production';
	const baseOptions = { path: '/', sameSite: 'lax' as const, secure };

	return {
		sessionToken: {
			name: `${secure ? '__Secure-' : ''}${prefix}.session-token`,
			options: { ...baseOptions, httpOnly: true },
		},
		callbackUrl: {
			name: `${secure ? '__Secure-' : ''}${prefix}.callback-url`,
			options: { ...baseOptions, httpOnly: true },
		},
		csrfToken: {
			name: `${secure ? '__Host-' : ''}${prefix}.csrf-token`,
			options: { ...baseOptions, httpOnly: true },
		},
	};
};

const parseExpirationToMs = (expiration: unknown): number => {
	if (typeof expiration === 'number') {
		return Number.isFinite(expiration) ? expiration : 0;
	}

	if (typeof expiration === 'string') {
		const parsedDate = Date.parse(expiration);
		if (!Number.isNaN(parsedDate)) {
			return parsedDate;
		}

		const parsedNumber = Number(expiration);
		if (Number.isFinite(parsedNumber)) {
			return parsedNumber;
		}
	}

	return 0;
};

const getJwtExpirationIso = (token: string): string | null => {
	try {
		const payload = token.split('.')[1];
		if (!payload) {
			return null;
		}

		const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
		const parsed = JSON.parse(decodedPayload) as { exp?: number };
		if (!parsed.exp || !Number.isFinite(parsed.exp)) {
			return null;
		}

		return new Date(parsed.exp * 1000).toISOString();
	} catch {
		return null;
	}
};

export const { handlers, auth } = NextAuth({
	providers: [
		Credentials({
			type: 'credentials',
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email', placeholder: 'email' },
				password: { label: 'Password', type: 'password', placeholder: 'password' },
			},
			// used in login page ex :
			// await signIn('credentials', {email: values.email,password: values.password,redirect: false});
			async authorize(credentials) {
				const validatedCredentials = z
					.object({
						email: z.email(),
						password: z.string(),
					})
					.safeParse(credentials);

				if (!validatedCredentials.success) {
					return null;
				}

				const { email, password } = validatedCredentials.data;
				const url = `${process.env.NEXT_PUBLIC_ACCOUNT_LOGIN}`;

				try {
					const instance = allowAnyInstance();
					const response: AccountPostLoginResponseType = await postApi(url, instance, {
						email,
						password,
					});

					if (response.status === 200) {
						const { user, access, refresh, access_expiration, refresh_expiration } = response.data;

						return {
							id: String(user.pk), // Convert pk to string
							email: user.email,
							name: `${user.first_name} ${user.last_name}`, // Construct full name
							image: null,
							user: {
								id: String(user.pk),
								pk: user.pk,
								email: user.email,
								emailVerified: null, // Backend doesn't provide this
								name: `${user.first_name} ${user.last_name}`,
								first_name: user.first_name,
								last_name: user.last_name,
								image: null,
							},
							access,
							access_expiration,
							refresh,
							refresh_expiration,
						};
					} else {
						return null;
					}
				} catch (error) {
					console.error('[Auth] Login failed:', error instanceof Error ? error.message : error);
				}

				return null;
			},
		}),
		Credentials({
			id: 'sso-code',
			type: 'credentials',
			name: 'sso-code',
			credentials: {
				code: { label: 'Code', type: 'text' },
			},
			async authorize(credentials) {
				const validatedCredentials = z
					.object({
						code: z.string().min(1),
					})
					.safeParse(credentials);

				if (!validatedCredentials.success) {
					return null;
				}

				try {
					const instance = allowAnyInstance();
					const response: AccountPostLoginResponseType = await postApi(
						`${process.env.NEXT_PUBLIC_ACCOUNT_SSO_EXCHANGE}`,
						instance,
						{ code: validatedCredentials.data.code },
					);

					if (response.status === 200) {
						const { user, access, refresh, access_expiration, refresh_expiration } = response.data;
						return {
							id: String(user.pk),
							email: user.email,
							name: `${user.first_name} ${user.last_name}`,
							image: null,
							user: {
								id: String(user.pk),
								pk: user.pk,
								email: user.email,
								emailVerified: null,
								name: `${user.first_name} ${user.last_name}`,
								first_name: user.first_name,
								last_name: user.last_name,
								image: null,
							},
							access,
							access_expiration,
							refresh,
							refresh_expiration,
						};
					}
				} catch (error) {
					console.error('[Auth] SSO login failed:', error instanceof Error ? error.message : error);
				}

				return null;
			},
		}),
	],

	secret: process.env.NEXTAUTH_SECRET, // Ensure this is set securely
	session: {
		strategy: 'jwt', // Persist the session using JWTs
		maxAge: 6 * 24 * 60 * 60,    // 6 days — safely within 7-day backend refresh window
		updateAge: 60 * 60, // Update JWT every 1 hour
	},
	jwt: {
		maxAge: 6 * 24 * 60 * 60,    // 6 days
	},

	cookies: getAuthCookies('ebh-gestion-magasin'),

	pages: {
		signIn: '/login',
		error: '/login',
	},

	callbacks: {
		async signIn({ user, account }) {
			if (account) {
				if (account.provider === 'credentials' || account.provider === 'sso-code') {
					account.user = user.user;
					account.access = user.access;
					account.refresh = user.refresh;
					account.access_expiration = user.access_expiration;
					account.refresh_expiration = user.refresh_expiration;
					return true;
				}
				return false;
			}
			return false;
		},

		async jwt({ token, account, user }) {
			if (account && user) {
				// On initial login
				token.access = user.access; // access token
				token.refresh = user.refresh; // refresh token
				token.access_expiration = user.access_expiration;
				token.refresh_expiration = user.refresh_expiration;
				token.user = user.user; // user object
				return token;
			}

			// NEW GUARD: if refresh token is itself expired, force re-auth immediately
			if (token.refresh_expiration && Date.now() >= parseExpirationToMs(token.refresh_expiration)) {
				return null;
			}

			// Proactively refresh the access token 5 minutes before it expires.
			// With refetchInterval polling every 4 minutes and a 15-minute access
			// token lifetime, this ensures a refresh happens at ~t=12min instead
			// of waiting until after expiry at t=16min.
			const REFRESH_BUFFER_MS = 5 * 60 * 1000;
			if (Date.now() >= parseExpirationToMs(token.access_expiration) - REFRESH_BUFFER_MS) {
				// Guard: if refresh token is missing or empty, return stale token
				// rather than destroying the session — the getSession() retry
				// in the Axios interceptor will attempt recovery.
				if (!token.refresh) {
					return token;
				}
				try {
					// Call your refresh token API if necessary
					const instance = allowAnyInstance();
					const refreshed = await postApi(`${process.env.NEXT_PUBLIC_ACCOUNT_REFRESH_TOKEN}`, instance, {
						refresh: token.refresh,
					});

					if (refreshed.status === 200) {
						const refreshedAccessToken = refreshed.data.access ?? refreshed.data.accessToken;
						if (!refreshedAccessToken) {
							return token;
						}

						token.access = refreshedAccessToken;
						const refreshedAccessExpiration =
							refreshed.data.access_expiration ??
							refreshed.data.accessTokenExpires ??
							getJwtExpirationIso(refreshedAccessToken);

						if (refreshedAccessExpiration) {
							token.access_expiration = String(refreshedAccessExpiration);
						}
						if (refreshed.data.refresh) {
							token.refresh = refreshed.data.refresh;
						}
						if (refreshed.data.refresh_expiration) {
							token.refresh_expiration = String(refreshed.data.refresh_expiration);
						}
					}
				} catch (error) {
					console.error('[Auth] Token refresh failed:', error instanceof Error ? error.message : error);
					// Check if the backend explicitly rejected the refresh token (401)
					const statusCode = (error as { error?: { status_code?: number } })?.error?.status_code;
					if (statusCode === 401) {
						return null;
					}
					// For transient errors (network, 5xx) keep the stale token so the
					// session survives and retries on the next poll.
				}
			}
			return token;
		},

		async session({ session, token }) {
			session.accessToken = String(token.access);
			session.refreshToken = String(token.refresh);
			session.accessTokenExpiration = String(token.access_expiration);
			session.refreshTokenExpiration = String(token.refresh_expiration);
			// @ts-expect-error next-auth augmented AdapterUser extends User, creating an intersection type
			session.user = token.user;
			return session;
		},
	},
	debug: process.env.NODE_ENV === 'development',
});
