import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });
const mockRedirect = jest.fn((url: string | URL) => REDIRECT_SENTINEL(String(url)));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

const mockCookies = jest.fn() as jest.MockedFunction<
	() => Promise<{ get: (key: string) => { value: string } | undefined }>
>;
jest.mock('next/headers', () => ({
	__esModule: true,
	cookies: mockCookies,
}));

jest.mock('@/components/pages/auth/reset-password/setPasswordComplete', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'SET_PASSWORD_COMPLETE_MARKER');
	},
}));

jest.mock('./clearCookiesClient', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'CLEAR_COOKIES_CLIENT_MARKER');
	},
}));

const AUTH_RESET_PASSWORD = '/reset-password';
const DASHBOARD = '/dashboard';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_RESET_PASSWORD,
	DASHBOARD,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('SetPasswordCompletePage server component', () => {
	it('redirects to DASHBOARD when session exists', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 1, email: 'a@b.com' } });
		mockCookies.mockResolvedValueOnce({ get: () => undefined });

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			 
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		await Page!();
		expect(mockRedirect).toHaveBeenCalledWith(DASHBOARD);
	});

	it('redirects to AUTH_RESET_PASSWORD when pass_updated cookie missing', async () => {
		mockAuth.mockResolvedValueOnce(null);
		mockCookies.mockResolvedValueOnce({ get: () => undefined });

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			 
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		await Page!();
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_RESET_PASSWORD);
	});

	it('renders ClearCookiesClient and SetPasswordComplete when pass_updated cookie present and no session', async () => {
		mockAuth.mockResolvedValueOnce(null);
		mockCookies.mockResolvedValueOnce({
			get: (key: string) => (key === '@pass_updated' ? { value: '1' } : undefined),
		});

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			 
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		const result = await Page!();
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		expect(html).toContain('CLEAR_COOKIES_CLIENT_MARKER');
		expect(html).toContain('SET_PASSWORD_COMPLETE_MARKER');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
