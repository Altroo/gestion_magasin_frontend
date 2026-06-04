import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface WSState {
	maintenance: boolean;
}

const initialState: WSState = {
	maintenance: false,
};

const wsSlice = createSlice({
	name: 'ws',
	initialState,
	reducers: {
		setWSMaintenance: (state, action: PayloadAction<boolean>) => {
			state.maintenance = action.payload;
		},
	},
});

export const { setWSMaintenance } = wsSlice.actions;

export default wsSlice.reducer;
