import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AccountStateInterface } from '@/types/accountTypes';
import type { UserClass } from '@/models/classes';

const initialState: AccountStateInterface = {
	profil: {},
};

const accountSlice = createSlice({
	name: 'account',
	initialState: initialState,
	reducers: {
		setProfil: (state, action: PayloadAction<UserClass>) => {
			state.profil = action.payload;
		},
		setWSUserAvatar: (state, action: PayloadAction<{ avatar: string }>) => {
			state.profil.avatar = action.payload.avatar;
		},
	},
});

export const { setProfil, setWSUserAvatar } = accountSlice.actions;

export default accountSlice.reducer;
