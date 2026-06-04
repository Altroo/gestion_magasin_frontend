import { getInitStateToken, getAccessToken, getProfilState } from './index';
import { UserClass } from '@/models/classes';

describe('Redux selectors', () => {
	const mockUser = new UserClass(
		1,
		'John',
		'Doe',
		'john.doe@example.com',
		'M',
		null,
		null,
		true,
		true,
		false,
		'2023-01-01T12:00:00Z',
		'2023-12-01T08:30:00Z',
		'2023-12-01T08:30:00Z',
		true,   // can_view
		false,  // can_print
		true,   // can_create
		false,  // can_edit
		false,  // can_delete
	);

	const mockState = {
		_init: {
			initStateToken: {
				access: 'mock-access-token',
				refresh: 'mock-refresh-token',
				user: { pk: 1, email: 'john.doe@example.com', first_name: 'John', last_name: 'Doe' },
				access_expiration: '2025-12-31T23:59:59Z',
				refresh_expiration: '2026-12-31T23:59:59Z',
			},
		},
		account: {
			profil: mockUser,
		},
	};

	it('getInitStateToken returns the initStateToken object', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(getInitStateToken(mockState as any)).toEqual(mockState._init.initStateToken);
	});

	it('getAccessToken returns the access token string', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(getAccessToken(mockState as any)).toBe('mock-access-token');
	});

	it('getProfilState returns the profil UserClass instance', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(getProfilState(mockState as any)).toBe(mockUser);
	});
});
