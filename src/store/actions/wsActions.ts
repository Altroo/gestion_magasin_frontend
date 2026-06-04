import * as types from './index';
import type { NotificationType } from '@/types/gestionMagasinTypes';

export const WSUserAvatarAction = (pk: number, avatar: string) => {
	return {
		type: types.WS_USER_AVATAR,
		pk,
		avatar,
	};
};

export const WSMaintenanceAction = (maintenance: boolean) => {
	return {
		type: types.WS_MAINTENANCE,
		maintenance,
	};
};

export const WSReconnectedAction = () => {
	return {
		type: types.WS_RECONNECTED,
	};
};

export const WSNotificationAction = (notification: NotificationType) => {
	return {
		type: types.WS_NOTIFICATION,
		notification,
	};
};
