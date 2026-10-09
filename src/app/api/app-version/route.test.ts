/** @jest-environment node */
import { GET, dynamic } from './route';
import { APP_VERSION } from '@/utils/appVersion';

it('returns the deployed frontend version without caching', async () => {
	const response = GET();
	expect(dynamic).toBe('force-dynamic');
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ version: APP_VERSION });
});
