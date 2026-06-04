import { getAccessTokenFromSession } from './session';
import type { AppSession } from '@/types/_initTypes';

describe('getAccessTokenFromSession', () => {
	it('returns undefined when session is undefined', () => {
		expect(getAccessTokenFromSession(undefined)).toBeUndefined();
	});

	it('returns accessToken from root when present and non-empty', () => {
		const session: AppSession = {
			accessToken: 'mock-token',
			refreshToken: 'mock-refresh',
			accessTokenExpiration: '2099-12-31T23:59:59Z',
			refreshTokenExpiration: '2099-12-31T23:59:59Z',
			expires: '2099-12-31T23:59:59Z',
			user: {
				accessToken: 'user-mock-token',
				pk: 1,
				email: 'test@example.com',
				first_name: 'Test',
				last_name: 'User',
				id: 'user-id',
				emailVerified: null,
				name: 'Test User',
			},
		};
		expect(getAccessTokenFromSession(session)).toBe('mock-token');
	});

	it('returns user.accessToken when root accessToken is empty and user.accessToken is present', () => {
		const session: AppSession = {
			accessToken: '',
			refreshToken: 'refresh',
			accessTokenExpiration: '2099-12-31',
			refreshTokenExpiration: '2099-12-31',
			expires: '2099-12-31',
			user: {
				accessToken: 'user-token',
				pk: 2,
				email: 'a@b.com',
				first_name: 'A',
				last_name: 'B',
				id: 'id2',
				emailVerified: null,
				name: 'A B',
			},
		};
		expect(getAccessTokenFromSession(session)).toBe('user-token');
	});

	it('returns undefined when both root and user accessToken are empty', () => {
		const session: AppSession = {
			accessToken: '',
			refreshToken: '',
			accessTokenExpiration: '',
			refreshTokenExpiration: '',
			expires: '',
			user: {
				accessToken: '',
				pk: 3,
				email: 'c@d.com',
				first_name: 'C',
				last_name: 'D',
				id: 'id3',
				emailVerified: null,
				name: 'C D',
			},
		};
		expect(getAccessTokenFromSession(session)).toBeUndefined();
	});

	it('handles missing user and returns root accessToken if present', () => {
		const session = {
			accessToken: 'only-root',
			refreshToken: '',
			accessTokenExpiration: '',
			refreshTokenExpiration: '',
			expires: '',
		} as unknown as AppSession;
		expect(getAccessTokenFromSession(session)).toBe('only-root');
	});
});
