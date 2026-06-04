import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NotificationType } from '@/types/gestionMagasinTypes';

type NotificationState = {
	unreadCount: number;
	latestNotification: NotificationType | null;
};

const initialState: NotificationState = {
	unreadCount: 0,
	latestNotification: null,
};

const notificationSlice = createSlice({
	name: 'notification',
	initialState,
	reducers: {
		setUnreadCount: (state, action: PayloadAction<number>) => {
			state.unreadCount = action.payload;
		},
		incrementUnreadCount: (state) => {
			state.unreadCount += 1;
		},
		setLatestNotification: (state, action: PayloadAction<NotificationType>) => {
			state.latestNotification = action.payload;
		},
	},
});

export const { incrementUnreadCount, setLatestNotification, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
