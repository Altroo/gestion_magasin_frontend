import { APP_VERSION } from '@/utils/appVersion';
import reducer, { setWSMaintenance } from './wsSlice';

describe('wsSlice reducer', () => {
	it('should return the initial state when passed an empty action', () => {
		const result = reducer(undefined, { type: '' });
		expect(result).toEqual({
			maintenance: false,
			localVersion: APP_VERSION,
			serverVersion: null,
		});
	});

	it('should handle setWSMaintenance', () => {
		const result = reducer(undefined, setWSMaintenance(true));
		expect(result).toEqual({
			maintenance: true,
			localVersion: APP_VERSION,
			serverVersion: null,
		});
	});
});
