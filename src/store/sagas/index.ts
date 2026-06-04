import { all, call, fork, spawn } from 'redux-saga/effects';
import { watchInit } from '@/store/sagas/_initSaga';
import { watchAccount } from '@/store/sagas/accountSaga';
import { watchWS } from '@/store/sagas/wsSaga';

const sagas = [watchInit, watchAccount];

export function* rootSaga() {
	yield all([
		...sagas.map((saga) =>
			spawn(function* () {
				while (true) {
					try {
						yield call(saga);
					} catch (e) {
						throw new Error('Saga error : ' + e);
					}
				}
			}),
		),
		fork(watchWS),
	]);
}
