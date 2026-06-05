describe('routes', () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...OLD_ENV };
	});

	afterAll(() => {
		process.env = OLD_ENV;
	});

	it('builds routes from the configured domain prefix', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'http://localhost:3006';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.SITE_ROOT).toBe('http://localhost:3006/');
		expect(routes.AUTH_LOGIN).toBe('http://localhost:3006/login');
		expect(routes.AUTH_RESET_PASSWORD).toBe('http://localhost:3006/reset-password');
		expect(routes.AUTH_RESET_PASSWORD_ENTER_CODE).toBe('http://localhost:3006/reset-password/enter-code');
		expect(routes.AUTH_RESET_PASSWORD_SET_PASSWORD).toBe('http://localhost:3006/reset-password/set-password');
		expect(routes.AUTH_RESET_PASSWORD_COMPLETE).toBe('http://localhost:3006/reset-password/set-password-complete');
		expect(routes.DASHBOARD).toBe('http://localhost:3006/dashboard');
		expect(routes.DASHBOARD_POS).toBe('http://localhost:3006/dashboard/caise');
		expect(routes.DASHBOARD_EDIT_PROFILE).toBe('http://localhost:3006/dashboard/settings/edit-profile');
		expect(routes.DASHBOARD_PASSWORD).toBe('http://localhost:3006/dashboard/settings/password');
	});

	it('builds USERS routes from a production domain prefix', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'https://gestion-magasin.elbouazzatiholding.ma';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.USERS_LIST).toBe('https://gestion-magasin.elbouazzatiholding.ma/dashboard/users');
		expect(routes.USERS_ADD).toBe('https://gestion-magasin.elbouazzatiholding.ma/dashboard/users/new');
		expect(routes.USERS_VIEW(7)).toBe('https://gestion-magasin.elbouazzatiholding.ma/dashboard/users/7');
		expect(routes.USERS_EDIT(7)).toBe('https://gestion-magasin.elbouazzatiholding.ma/dashboard/users/7/edit');
	});

	it('builds magasin sales routes with store context', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'http://localhost:3006';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.SALES_LIST).toBe('http://localhost:3006/dashboard/sales');
		expect(routes.SALES_ADD()).toBe('http://localhost:3006/dashboard/sales/new');
		expect(routes.SALES_ADD(3)).toBe('http://localhost:3006/dashboard/sales/new?store_id=3');
		expect(routes.SALES_VIEW(8, 3)).toBe('http://localhost:3006/dashboard/sales/8?store_id=3');
	});

	it('builds pointage routes from the configured domain prefix', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'http://localhost:3006';
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const routes = require('./routes');

		expect(routes.ATTENDANCE_LIST).toBe('http://localhost:3006/dashboard/pointage');
		expect(routes.ATTENDANCE_ADD(1)).toBe('http://localhost:3006/dashboard/pointage/new?store_id=1');
		expect(routes.ATTENDANCE_VIEW(7, 1)).toBe('http://localhost:3006/dashboard/pointage/7?store_id=1');
		expect(routes.ATTENDANCE_EDIT(7, 1)).toBe('http://localhost:3006/dashboard/pointage/7/edit?store_id=1');
	});
});
