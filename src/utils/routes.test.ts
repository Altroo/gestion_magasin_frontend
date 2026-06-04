describe('routes', () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...OLD_ENV };
	});

	afterAll(() => {
		process.env = OLD_ENV;
	});

	it('builds same-origin routes from the default base path', () => {
		process.env.NEXT_PUBLIC_APP_BASE_PATH = '/';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.SITE_ROOT).toBe('/');
		expect(routes.AUTH_LOGIN).toBe('/login');
		expect(routes.AUTH_RESET_PASSWORD).toBe('/reset-password');
		expect(routes.AUTH_RESET_PASSWORD_ENTER_CODE).toBe('/reset-password/enter-code');
		expect(routes.AUTH_RESET_PASSWORD_SET_PASSWORD).toBe('/reset-password/set-password');
		expect(routes.AUTH_RESET_PASSWORD_COMPLETE).toBe('/reset-password/set-password-complete');
		expect(routes.DASHBOARD).toBe('/dashboard');
		expect(routes.DASHBOARD_EDIT_PROFILE).toBe('/dashboard/settings/edit-profile');
		expect(routes.DASHBOARD_PASSWORD).toBe('/dashboard/settings/password');
	});

	it('builds USERS routes from a custom base path', () => {
		process.env.NEXT_PUBLIC_APP_BASE_PATH = '/gestion-magasin';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.USERS_LIST).toBe('/gestion-magasin/dashboard/users');
		expect(routes.USERS_ADD).toBe('/gestion-magasin/dashboard/users/new');
		expect(routes.USERS_VIEW(7)).toBe('/gestion-magasin/dashboard/users/7');
		expect(routes.USERS_EDIT(7)).toBe('/gestion-magasin/dashboard/users/7/edit');
	});

	it('builds magasin sales routes with store context', () => {
		process.env.NEXT_PUBLIC_APP_BASE_PATH = '/';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.SALES_LIST).toBe('/dashboard/sales');
		expect(routes.SALES_ADD()).toBe('/dashboard/sales/new');
		expect(routes.SALES_ADD(3)).toBe('/dashboard/sales/new?store_id=3');
		expect(routes.SALES_VIEW(8, 3)).toBe('/dashboard/sales/8?store_id=3');
	});

	it('builds routes without a base path', () => {
		delete process.env.NEXT_PUBLIC_APP_BASE_PATH;
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.SITE_ROOT).toBe('/');
		expect(routes.AUTH_LOGIN).toBe('/login');
	});
});
