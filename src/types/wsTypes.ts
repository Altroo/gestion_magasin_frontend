import type {
	WSMaintenanceAction,
	WSUserAvatarAction,
	WSReconnectedAction,
	WSNotificationAction,
} from '@/store/actions/wsActions';

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
	version?: string;
}

export type WSAction =
	| ReturnType<typeof WSUserAvatarAction>
	| ReturnType<typeof WSMaintenanceAction>
	| ReturnType<typeof WSReconnectedAction>
	| ReturnType<typeof WSNotificationAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
	version?: string;
	id?: number;
	title?: string;
	message?: string;
	notification_type?: string;
	object_id?: number | null;
	store?: number | null;
	product?: number | null;
	is_read?: boolean;
	date_created?: string;
};

export type WSEnvelope = {
	message: WSMessage;
};
