import NextAuth from 'next-auth';
import type { Account, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Mock dependencies before importing auth
jest.mock('next-auth', () => {
	const mockNextAuth = jest.fn(() => ({
		handlers: { GET: jest.fn(), POST: jest.fn() },
		auth: jest.fn(),
	}));
	return {
		__esModule: true,
		default: mockNextAuth,
	};
});

jest.mock('next-auth/providers/credentials', () => ({
	__esModule: true,
	default: jest.fn((config) => ({ ...config, type: 'credentials' })),
}));

jest.mock('@/utils/helpers', () => ({
	allowAnyInstance: jest.fn(() => ({})),
}));

jest.mock('@/utils/apiHelpers', () => ({
	postApi: jest.fn(),
}));

import { allowAnyInstance } from '@/utils/helpers';
import { postApi } from '@/utils/apiHelpers';

const mockedNextAuth = NextAuth as jest.Mock;
const mockedPostApi = postApi as jest.Mock;
const mockedAllowAnyInstance = allowAnyInstance as jest.Mock;

// Helper to extract config passed to NextAuth
const getNextAuthConfig = () => {
	return mockedNextAuth.mock.calls[0]?.[0];
};

// Helper to get authorize function from credentials provider
const getAuthorizeFunction = () => {
	const config = getNextAuthConfig();
	return config?.providers?.[0]?.authorize;
};

// Helper to get callbacks
const getCallbacks = () => {
	const config = getNextAuthConfig();
	return config?.callbacks;
};

describe('auth.ts', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Re-import to trigger NextAuth call
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			require('./auth');
		});
	});

	describe('NextAuth Configuration', () => {
		it('should configure NextAuth with correct settings', () => {
			expect(mockedNextAuth).toHaveBeenCalled();
			const config = getNextAuthConfig();

			expect(config).toBeDefined();
			expect(config.session).toEqual({
				strategy: 'jwt',
				maxAge: 6 * 24 * 60 * 60,
				updateAge: 60 * 60,
			});
			expect(config.jwt).toEqual({
				maxAge: 6 * 24 * 60 * 60,
			});
			expect(config.pages).toEqual({
				signIn: 'login',
				error: 'login',
			});
		});

		it('should have credentials provider configured', () => {
			const config = getNextAuthConfig();
			const provider = config?.providers?.[0];

			expect(provider).toBeDefined();
			expect(provider.type).toBe('credentials');
			expect(provider.name).toBe('credentials');
			expect(provider.credentials).toEqual({
				email: { label: 'Email', type: 'email', placeholder: 'email' },
				password: { label: 'Password', type: 'password', placeholder: 'password' },
			});
		});
	});

	describe('authorize function', () => {
		const validCredentials = {
			email: 'test@example.com',
			password: 'password123',
		};

		const mockSuccessResponse = {
			status: 200,
			data: {
				user: {
					pk: 1,
					email: 'test@example.com',
					first_name: 'John',
					last_name: 'Doe',
				},
				access: 'access-token-123',
				refresh: 'refresh-token-456',
				access_expiration: '2025-12-31T00:00:00Z',
				refresh_expiration: '2026-01-15T00:00:00Z',
			},
		};

		it('should return null for invalid email format', async () => {
			const authorize = getAuthorizeFunction();
			const result = await authorize({ email: 'invalid-email', password: 'pass' });

			expect(result).toBeNull();
			expect(mockedPostApi).not.toHaveBeenCalled();
		});

		it('should return null for missing password', async () => {
			const authorize = getAuthorizeFunction();
			const result = await authorize({ email: 'test@example.com' });

			expect(result).toBeNull();
		});

		it('should return null for missing email', async () => {
			const authorize = getAuthorizeFunction();
			const result = await authorize({ password: 'password123' });

			expect(result).toBeNull();
		});

		it('should return user object on successful login', async () => {
			mockedPostApi.mockResolvedValueOnce(mockSuccessResponse);

			const authorize = getAuthorizeFunction();
			const result = await authorize(validCredentials);

			expect(mockedAllowAnyInstance).toHaveBeenCalled();
			expect(mockedPostApi).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
				email: validCredentials.email,
				password: validCredentials.password,
			});

			expect(result).toEqual({
				id: '1',
				email: 'test@example.com',
				name: 'John Doe',
				image: null,
				user: {
					id: '1',
					pk: 1,
					email: 'test@example.com',
					emailVerified: null,
					name: 'John Doe',
					first_name: 'John',
					last_name: 'Doe',
					image: null,
				},
				access: 'access-token-123',
				access_expiration: '2025-12-31T00:00:00Z',
				refresh: 'refresh-token-456',
				refresh_expiration: '2026-01-15T00:00:00Z',
			});
		});

		it('should return null when API returns non-200 status', async () => {
			mockedPostApi.mockResolvedValueOnce({ status: 401 });

			const authorize = getAuthorizeFunction();
			const result = await authorize(validCredentials);

			expect(result).toBeNull();
		});

		it('should return null when API throws', async () => {
			mockedPostApi.mockRejectedValueOnce(new Error('Network error'));

			const authorize = getAuthorizeFunction();
			const result = await authorize(validCredentials);

			expect(result).toBeNull();
		});
	});

	describe('signIn callback', () => {
		it('should return true and attach tokens for credentials provider', async () => {
			const callbacks = getCallbacks();
			const user = {
				user: { pk: 1, email: 'test@example.com' },
				access: 'access-token',
				refresh: 'refresh-token',
				access_expiration: '2025-12-31',
				refresh_expiration: '2026-01-15',
			} as unknown as User;

			const account = {
				provider: 'credentials',
			} as Account;

			const result = await callbacks.signIn({ user, account });

			expect(result).toBe(true);
			expect(account.user).toEqual(user.user);
			expect(account.access).toBe('access-token');
			expect(account.refresh).toBe('refresh-token');
		});

		it('should return false for non-credentials provider', async () => {
			const callbacks = getCallbacks();
			const user = {} as User;
			const account = { provider: 'google' } as Account;

			const result = await callbacks.signIn({ user, account });

			expect(result).toBe(false);
		});

		it('should return false when account is null', async () => {
			const callbacks = getCallbacks();
			const user = {} as User;

			const result = await callbacks.signIn({ user, account: null });

			expect(result).toBe(false);
		});
	});

	describe('jwt callback', () => {
		it('should populate token on initial login', async () => {
			const callbacks = getCallbacks();
			const token = {} as JWT;
			const user = {
				user: { pk: 1, email: 'test@example.com' },
				access: 'access-token',
				refresh: 'refresh-token',
				access_expiration: '2025-12-31',
				refresh_expiration: '2026-01-15',
			} as unknown as User;
			const account = { provider: 'credentials' } as Account;

			const result = await callbacks.jwt({ token, account, user });

			expect(result.access).toBe('access-token');
			expect(result.refresh).toBe('refresh-token');
			expect(result.access_expiration).toBe('2025-12-31');
			expect(result.refresh_expiration).toBe('2026-01-15');
			expect(result.user).toEqual(user.user);
		});

		it('should refresh token when access token is expired', async () => {
			mockedPostApi.mockResolvedValueOnce({
				status: 200,
				data: {
					access: 'new-access-token',
					access_expiration: '2026-01-01T00:00:00Z',
					refresh: 'new-refresh-token',
				},
			});

			const callbacks = getCallbacks();
			const token = {
				access: 'old-access-token',
				refresh: 'old-refresh-token',
				access_expiration: 0, // Already expired
			} as unknown as JWT;

			const result = await callbacks.jwt({ token, account: undefined, user: undefined });

			expect(mockedPostApi).toHaveBeenCalled();
			expect(result.access).toBe('new-access-token');
			expect(result.access_expiration).toBe('2026-01-01T00:00:00Z');
			expect(result.refresh).toBe('new-refresh-token');
		});

		it('should keep old refresh token if not provided in refresh response', async () => {
			mockedPostApi.mockResolvedValueOnce({
				status: 200,
				data: {
					access: 'new-access-token',
					accessTokenExpires: '2026-01-01',
					// No refresh token in response
				},
			});

			const callbacks = getCallbacks();
			const token = {
				access: 'old-access-token',
				refresh: 'old-refresh-token',
				access_expiration: 0,
			} as unknown as JWT;

			const result = await callbacks.jwt({ token, account: undefined, user: undefined });

			expect(result.refresh).toBe('old-refresh-token');
		});

		it('should handle refresh token failure gracefully', async () => {
			mockedPostApi.mockRejectedValueOnce(new Error('Refresh failed'));

			const callbacks = getCallbacks();
			const token = {
				access: 'old-access-token',
				refresh: 'old-refresh-token',
				access_expiration: 0,
			} as unknown as JWT;

			const result = await callbacks.jwt({ token, account: undefined, user: undefined });

			// For transient errors (not 401), the stale token is preserved so the session survives retries.
			expect(result).toEqual(expect.objectContaining({ access: 'old-access-token', refresh: 'old-refresh-token' }));
		});

		it('should not refresh when token is not expired', async () => {
			const callbacks = getCallbacks();
			const futureTimestamp = Date.now() + 1000 * 60 * 60; // 1 hour from now
			const token = {
				access: 'current-access-token',
				refresh: 'current-refresh-token',
				access_expiration: futureTimestamp,
			} as unknown as JWT;

			const result = await callbacks.jwt({ token, account: undefined, user: undefined });

			expect(mockedPostApi).not.toHaveBeenCalled();
			expect(result.access).toBe('current-access-token');
		});
	});

	describe('session callback', () => {
		it('should populate session with token data', async () => {
			const callbacks = getCallbacks();
			const session = { user: {} } as {
				user: object;
				accessToken?: string;
				refreshToken?: string;
				accessTokenExpiration?: string;
				refreshTokenExpiration?: string;
			};
			const token = {
				access: 'access-token',
				refresh: 'refresh-token',
				access_expiration: '2025-12-31',
				refresh_expiration: '2026-01-15',
				user: { pk: 1, email: 'test@example.com' },
			} as unknown as JWT;

			const result = await callbacks.session({ session, token });

			expect(result.accessToken).toBe('access-token');
			expect(result.refreshToken).toBe('refresh-token');
			expect(result.accessTokenExpiration).toBe('2025-12-31');
			expect(result.refreshTokenExpiration).toBe('2026-01-15');
			expect(result.user).toEqual({ pk: 1, email: 'test@example.com' });
		});
	});
});
