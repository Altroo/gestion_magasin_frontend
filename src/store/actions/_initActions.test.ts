import * as types from './index';
import { initAppSessionTokensAction, refreshAppTokenStatesAction } from './_initActions';
import { Session } from 'next-auth';

describe('Redux Init Actions', () => {
	it('initAppSessionTokensAction creates INIT_APP_SESSION_TOKENS action with session', () => {
		const mockSession: Session = {
			user: {
				pk: 1,
				email: 'test@example.com',
				first_name: 'John',
				last_name: 'Doe',
				id: '',
				emailVerified: null,
				name: '',
			},
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			accessTokenExpiration: '2025-01-01',
			refreshTokenExpiration: '2025-01-02',
			expires: '2025-01-03',
		} as unknown as Session;

		const action = initAppSessionTokensAction(mockSession);
		expect(action).toEqual({
			type: types.INIT_APP_SESSION_TOKENS,
			session: mockSession,
		});
	});

	it('refreshAppTokenStatesAction creates REFRESH_APP_TOKEN_STATES action with session', () => {
		const mockSession: Session = {
			user: {
				pk: 2,
				email: 'jane@example.com',
				first_name: 'Jane',
				last_name: 'Smith',
				id: '',
				emailVerified: null,
				name: '',
			},
			accessToken: 'new-access-token',
			refreshToken: 'new-refresh-token',
			accessTokenExpiration: '2025-02-01',
			refreshTokenExpiration: '2025-02-02',
			expires: '2025-02-03',
		} as unknown as Session;

		const action = refreshAppTokenStatesAction(mockSession);
		expect(action).toEqual({
			type: types.REFRESH_APP_TOKEN_STATES,
			session: mockSession,
		});
	});
});
