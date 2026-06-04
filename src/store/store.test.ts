import { jest } from '@jest/globals';
import type { Middleware } from '@reduxjs/toolkit';
import type { SagaStore, RootState, AppDispatch } from './store';

jest.mock('@/store/slices/_initSlice', () => ({
	__esModule: true,
	default: (state = { init: true }) => state,
}));
jest.mock('@/store/slices/accountSlice', () => ({
	__esModule: true,
	default: (state = { account: true }) => state,
}));

function makeApiMock(name: string) {
	const dummyMiddleware: Middleware = () => (next) => (action) => next(action);
	return {
		reducerPath: name,
		reducer: (state = {}) => state,
		middleware: dummyMiddleware,
	};
}

jest.mock('@/store/services/account', () => ({
	__esModule: true,
	accountApi: makeApiMock('accountApi'),
	profilApi: makeApiMock('profilApi'),
	usersApi: makeApiMock('usersApi'),
}));

jest.mock('@/store/sagas', () => ({
	__esModule: true,
	rootSaga: function* rootSaga() {
		while (true) {
			yield;
		}
	},
}));

describe('makeStore', () => {
	let store: SagaStore;
	let dispatch: AppDispatch;

	beforeEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { makeStore } = require('./store') as { makeStore: () => SagaStore };
		store = makeStore();
		dispatch = store.dispatch as AppDispatch;
	});

	afterEach(() => {
		if (store?.sagaTask) {
			store.sagaTask.cancel();
		}
	});

	it('creates a store with the expected initial state shape', () => {
		const state = store.getState() as RootState;
		expect(state).toHaveProperty('_init');
		expect(state).toHaveProperty('account');
		expect(state).toHaveProperty('accountApi');
		expect(state).toHaveProperty('profilApi');
		expect(state).toHaveProperty('usersApi');
	});

	it('store has a sagaTask set after makeStore', () => {
		expect(store.sagaTask).toBeDefined();
	});

	it('dispatch is available', () => {
		expect(typeof dispatch).toBe('function');
	});
});
