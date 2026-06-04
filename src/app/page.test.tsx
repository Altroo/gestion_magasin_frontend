import { jest } from '@jest/globals';

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<{ user: { pk: number; email: string } } | null>>;

jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const mockRedirect = jest.fn(() => {
	throw new Error('redirect');
});

jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

const DASHBOARD = '/dashboard';
const AUTH_LOGIN = '/login';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	DASHBOARD,
	AUTH_LOGIN,
}));

afterEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('HomePage server component', () => {
	it('redirects to DASHBOARD when session exists', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 1, email: 'a@b.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page');
		const Page = mod.default as () => Promise<unknown>;

		await expect(Page()).rejects.toThrow('redirect');
		expect(mockRedirect).toHaveBeenCalledWith(DASHBOARD);
	});

	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page');
		const Page = mod.default as () => Promise<unknown>;

		await expect(Page()).rejects.toThrow('redirect');
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});
});
