import reducer, { setInitState, initToken, emptyInitStateToken, initialState } from './_initSlice';
import type { InitStateInterface, InitStateToken } from '@/types/_initTypes';

describe('_init slice', () => {
	const sampleToken: InitStateToken = {
		access: 'access-token',
		refresh: 'refresh-token',
		user: {
			pk: 7,
			email: 'test@example.com',
			first_name: 'First',
			last_name: 'Last',
		},
		access_expiration: '2025-12-31T23:59:59Z',
		refresh_expiration: '2026-12-31T23:59:59Z',
	};

	it('returns the initial state when given undefined state', () => {
		const state = reducer(undefined, { type: '@@INIT' });
		expect(state).toEqual(initialState);
	});

	it('setInitState replaces initStateToken with payload value', () => {
		const payload: InitStateInterface<InitStateToken> = { initStateToken: sampleToken };
		const next = reducer(initialState, setInitState(payload));
		expect(next.initStateToken).toEqual(sampleToken);
	});

	it('initToken resets state back to initialState', () => {
		const modified = { initStateToken: { ...sampleToken, access: 'changed' } };
		const afterSet = reducer(modified as typeof initialState, initToken());
		expect(afterSet).toEqual(initialState);
	});

	it('emptyInitStateToken shape matches expected defaults', () => {
		expect(emptyInitStateToken).toEqual({
			access: null,
			refresh: null,
			user: { pk: null, email: null, first_name: null, last_name: null },
			access_expiration: null,
			refresh_expiration: null,
		});
	});
});
