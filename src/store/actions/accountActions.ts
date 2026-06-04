import * as types from './index';
import type { UserClass } from '@/models/classes';

export const accountSetProfilAction = (props: UserClass) => ({
	type: types.ACCOUNT_SET_PROFIL,
	data: { ...props },
});

export const accountEditProfilAction = (props: UserClass) => ({
	type: types.ACCOUNT_EDIT_PROFIL,
	data: { ...props },
});
