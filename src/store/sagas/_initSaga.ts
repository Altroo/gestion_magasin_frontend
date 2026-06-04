import { call, put, takeLatest } from 'redux-saga/effects';
import * as Types from '../actions';
import type { InitStateInterface, InitStateToken, AppSession, MaintenanceGetRootResponseType } from '@/types/_initTypes';
import { setInitState } from '../slices/_initSlice';
import { setWSMaintenance } from '../slices/wsSlice';
import { allowAnyInstance } from '@/utils/helpers';
import { getApi } from '@/utils/apiHelpers';
import type { AxiosInstance } from 'axios';

export function* initAppSaga() {
	yield call(initMaintenanceSaga);
}

export function* initAppSessionTokensSaga(payload: { type: string; session: AppSession }) {
	const stateToken = {
		user: payload.session.user,
		access: payload.session.accessToken,
		refresh: payload.session.refreshToken,
		access_expiration: payload.session.accessTokenExpiration,
		refresh_expiration: payload.session.refreshTokenExpiration,
	};
	const appToken = {
		initStateToken: stateToken as InitStateToken,
	};
	yield put(setInitState(appToken));
}

export function* refreshAppTokenStatesSaga(payload: { type: string; session: Record<string, unknown> }) {
	const accessToken: string = payload.session['accessToken'] as string;
	const refreshToken: string = payload.session['refreshToken'] as string;
	const accessTokenExpiration = payload.session['accessTokenExpiration'] as string;
	const refreshTokenExpiration = payload.session['refreshTokenExpiration'] as string;
	const userObj = payload.session['user'] as {
		pk: number;
		email: string;
		first_name: string;
		last_name: string;
	};
	const appToken: InitStateInterface<InitStateToken> = {
		initStateToken: {
			access: accessToken,
			refresh: refreshToken,
			user: {
				pk: userObj.pk,
				email: userObj.email,
				first_name: userObj.first_name,
				last_name: userObj.last_name,
			},
			refresh_expiration: refreshTokenExpiration,
			access_expiration: accessTokenExpiration,
		},
	};
	if (appToken) {
		yield put(setInitState(appToken));
	}
}

export function* initMaintenanceSaga() {
	const url = process.env.NEXT_PUBLIC_WS_MAINTENANCE_ROOT;

	if (!url) {
		return;
	}

	const instance: AxiosInstance = yield call(() => allowAnyInstance());
	const response: MaintenanceGetRootResponseType = yield call(() => getApi(url, instance));

	if (response.status === 200) {
		yield put(setWSMaintenance(response.data.maintenance));
	}
}

export function* watchInit() {
	yield takeLatest(Types.INIT_APP, initAppSaga);
	yield takeLatest(Types.INIT_APP_SESSION_TOKENS, initAppSessionTokensSaga);
	yield takeLatest(Types.REFRESH_APP_TOKEN_STATES, refreshAppTokenStatesSaga);
}
