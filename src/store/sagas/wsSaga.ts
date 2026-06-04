import { call, put, select, take } from 'redux-saga/effects';
import { getSession } from 'next-auth/react';
import { initWebsocket } from '@/store/services/ws';
import { getAccessToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import type { Action } from 'redux';
import type { EventChannel, SagaIterator } from 'redux-saga';
import * as Types from '@/store/actions';
import { setWSMaintenance } from '@/store/slices/wsSlice';
import { incrementUnreadCount, setLatestNotification } from '@/store/slices/notificationSlice';
import { notificationApi } from '@/store/services/notification';
import type { NotificationType } from '@/types/gestionMagasinTypes';
import { initMaintenanceSaga } from '@/store/sagas/_initSaga';

type WSChannelAction = Action & {
	maintenance?: boolean;
	notification?: NotificationType;
};

function* monitorToken(
	selector: (state: RootState) => string | null,
	previousValue: string | null,
	takePattern = '*',
): SagaIterator<string | null> {
	while (true) {
		const nextValue: string | null = yield select(selector);
		if (nextValue !== previousValue) {
			return nextValue;
		}
		yield take(takePattern);
	}
}

export function* watchWS(): SagaIterator<void> {
	const token: string | null = yield call(monitorToken, getAccessToken, null);

	if (token) {
		const getToken = async (): Promise<string | null> => {
			const session = await getSession();
			return session?.accessToken ?? null;
		};
		const channel: EventChannel<WSChannelAction> = yield call(initWebsocket, getToken);

		while (true) {
			const action: WSChannelAction = yield take(channel);
			if (action.type === Types.WS_MAINTENANCE && typeof action.maintenance === 'boolean') {
				yield put(setWSMaintenance(action.maintenance));
			} else if (action.type === Types.WS_RECONNECTED) {
				yield call(initMaintenanceSaga);
			} else if (action.type === Types.WS_NOTIFICATION && action.notification) {
				yield put(incrementUnreadCount());
				yield put(setLatestNotification(action.notification));
				yield put(notificationApi.util.invalidateTags(['Notification']));
				if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
					new Notification(action.notification.title, {
						body: action.notification.message,
						icon: '/assets/ico/android-icon-192x192.png',
					});
				}
			} else {
				yield put(action);
			}
		}
	}
}
