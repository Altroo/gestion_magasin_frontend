import { runSaga } from 'redux-saga';
import { takeLatest } from 'redux-saga/effects';
import * as Types from '../actions';
import { accountSetProfilSaga, accountEditProfilSaga, wsUserAvatarSaga, watchAccount } from './accountSaga';
import { setProfil, setWSUserAvatar } from '../slices/accountSlice';
import { UserClass } from '@/models/classes';

const makeUser = (id: number) =>
	new UserClass(
		id,
		'John',
		'Doe',
		'john@example.com',
		'M',
		null,
		null,
		true,
		true,
		false,
		'2023-01-01',
		'2023-01-02',
		'2023-01-02',
		true,
		false,
		true,
		false,
		false,
	);

describe('account sagas', () => {
	it('accountSetProfilSaga dispatches setProfil with correct payload', async () => {
		const user = makeUser(1);
		const payload = { type: Types.ACCOUNT_SET_PROFIL, data: user };
		const dispatched: unknown[] = [];

		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			accountSetProfilSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setProfil(user)]);
	});

	it('accountEditProfilSaga dispatches setProfil with correct payload', async () => {
		const user = makeUser(2);
		const payload = { type: Types.ACCOUNT_EDIT_PROFIL, data: user };
		const dispatched: unknown[] = [];

		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			accountEditProfilSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setProfil(user)]);
	});

	it('wsUserAvatarSaga dispatches setWSUserAvatar with correct payload', async () => {
		const payload = { type: Types.WS_USER_AVATAR, pk: 1, avatar: 'avatar-url' };
		const dispatched: unknown[] = [];

		await runSaga(
			{ dispatch: (action: unknown) => dispatched.push(action) },
			wsUserAvatarSaga,
			payload,
		).toPromise();

		expect(dispatched).toEqual([setWSUserAvatar({ avatar: 'avatar-url' })]);
	});

	it('watchAccount uses takeLatest for all account action types', () => {
		const gen = watchAccount();

		expect(gen.next().value).toEqual(takeLatest(Types.ACCOUNT_SET_PROFIL, accountSetProfilSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.ACCOUNT_EDIT_PROFIL, accountEditProfilSaga));
		expect(gen.next().value).toEqual(takeLatest(Types.WS_USER_AVATAR, wsUserAvatarSaga));
	});
});
