import * as types from './index';
import { accountSetProfilAction, accountEditProfilAction } from './accountActions';
import { UserClass } from '@/models/classes';

describe('Account Actions', () => {
	const makeUser = (id: number, email: string) =>
		new UserClass(
			id,
			'John',
			'Doe',
			email,
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

	it('accountSetProfilAction creates ACCOUNT_SET_PROFIL action with user data', () => {
		const user = makeUser(1, 'john@example.com');
		const action = accountSetProfilAction(user);
		expect(action).toEqual({
			type: types.ACCOUNT_SET_PROFIL,
			data: { ...user },
		});
	});

	it('accountEditProfilAction creates ACCOUNT_EDIT_PROFIL action with user data', () => {
		const user = makeUser(2, 'jane@example.com');
		const action = accountEditProfilAction(user);
		expect(action).toEqual({
			type: types.ACCOUNT_EDIT_PROFIL,
			data: { ...user },
		});
	});
});
