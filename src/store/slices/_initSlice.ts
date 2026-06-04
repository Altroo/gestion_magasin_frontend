import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';

export const emptyInitStateToken: InitStateToken = {
	access: null,
	refresh: null,
	user: {
		pk: null,
		email: null,
		first_name: null,
		last_name: null,
	},
	access_expiration: null,
	refresh_expiration: null,
};

export const initialState: InitStateInterface<InitStateToken> = {
	initStateToken: emptyInitStateToken,
};

const _initSlice = createSlice({
	name: '_init',
	initialState: initialState,
	reducers: {
		setInitState: (state, action: PayloadAction<InitStateInterface<InitStateToken>>) => {
			state.initStateToken = action.payload.initStateToken;
		},
		initToken: () => {
			return initialState;
		},
	},
});

export const { setInitState, initToken } = _initSlice.actions;

export default _initSlice.reducer;
