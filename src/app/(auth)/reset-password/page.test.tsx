import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import { type ReactElement } from 'react';

jest.mock('@/components/pages/auth/reset-password/resetPassword', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { createElement } = require('react');
		return createElement('div', null, 'RESET_PASSWORD_CLIENT_MARKER');
	},
}));

afterEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('ResetPasswordPage', () => {
	it('renders ResetPasswordClient', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const mod = require('./page');
		const Page = mod.default as () => unknown;
		const html = renderToStaticMarkup(Page() as ReactElement);
		expect(html).toContain('RESET_PASSWORD_CLIENT_MARKER');
	});
});
