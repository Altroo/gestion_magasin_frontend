import { isPointageOnlyPathAllowed } from './pointageOnlyAccess';

describe('isPointageOnlyPathAllowed', () => {
	it.each([
		'/dashboard/pointage',
		'/dashboard/pointage/new',
		'/dashboard/pointage/42/edit',
		'/dashboard/settings/edit-profile',
		'/dashboard/settings/password',
	])('allows %s', (pathname) => {
		expect(isPointageOnlyPathAllowed(pathname)).toBe(true);
	});

	it.each([
		'/dashboard',
		'/dashboard/sales',
		'/dashboard/settings',
		'/dashboard/settings/notifications',
		'/dashboard/users',
	])('blocks %s', (pathname) => {
		expect(isPointageOnlyPathAllowed(pathname)).toBe(false);
	});
});
