import { runSaga } from 'redux-saga';
import * as Types from '../actions';
import { initAppSaga, initAppSessionTokensSaga, refreshAppTokenStatesSaga, watchInit } from './_initSaga';
import { setInitState } from '../slices/_initSlice';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';
import { takeLatest } from 'redux-saga/effects';

describe('init sagas', () => {
	it('initAppSessionTokensSaga dispatches setInitState with correct payload', async () => {
		const mockSession = {
			user: {
				pk: 1,
				email: 'test@example.com',
				first_name: 'John',
				last_name: 'Doe',
				id: '',
				emailVerified: null as null,
				name: '',
			},
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			accessTokenExpiration: '2025-01-01',
			refreshTokenExpiration: '2025-01-02',
			expires: '2025-01-03',
		};

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			initAppSessionTokensSaga,
			{ type: Types.INIT_APP_SESSION_TOKENS, session: mockSession as never },
		).toPromise();

		const expectedToken: InitStateToken = {
			user: mockSession.user,
			access: mockSession.accessToken,
			refresh: mockSession.refreshToken,
			access_expiration: mockSession.accessTokenExpiration,
			refresh_expiration: mockSession.refreshTokenExpiration,
		};

		const expectedAppToken: InitStateInterface<InitStateToken> = {
			initStateToken: expectedToken,
		};

		expect(dispatched).toEqual([setInitState(expectedAppToken)]);
	});

	it('refreshAppTokenStatesSaga dispatches setInitState with correct payload', async () => {
		const payload = {
			type: Types.REFRESH_APP_TOKEN_STATES,
			session: {
				accessToken: 'new-access',
				refreshToken: 'new-refresh',
				accessTokenExpiration: '2025-02-01',
				refreshTokenExpiration: '2025-02-02',
				user: {
					pk: 2,
					email: 'jane@example.com',
					first_name: 'Jane',
					last_name: 'Smith',
				},
			},
		};

		const dispatched: unknown[] = [];
		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			refreshAppTokenStatesSaga,
			payload,
		).toPromise();

		const expectedToken: InitStateToken = {
			access: 'new-access',
			refresh: 'new-refresh',
			user: { pk: 2, email: 'jane@example.com', first_name: 'Jane', last_name: 'Smith' },
			access_expiration: '2025-02-01',
			refresh_expiration: '2025-02-02',
		};

		expect(dispatched).toEqual([setInitState({ initStateToken: expectedToken })]);
	});

	it('watchInit uses takeLatest for INIT and REFRESH actions', () => {
		const gen = watchInit();

		const firstEffect = gen.next().value;
		expect(firstEffect).toEqual(
			takeLatest(Types.INIT_APP, initAppSaga),
		);

		const secondEffect = gen.next().value;
		expect(secondEffect).toEqual(
			takeLatest(Types.INIT_APP_SESSION_TOKENS, initAppSessionTokensSaga),
		);

		const thirdEffect = gen.next().value;
		expect(thirdEffect).toEqual(
			takeLatest(Types.REFRESH_APP_TOKEN_STATES, refreshAppTokenStatesSaga),
		);
	});
});
