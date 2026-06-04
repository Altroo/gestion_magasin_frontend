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

jest.mock('@/styles/globals.sass', () => ({}));

jest.mock('@/providers/sessionProvider', () => ({
	__esModule: true,
	default: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'SESSION_PROVIDER', props.children);
	},
}));

jest.mock('@/providers/storeProvider', () => ({
	__esModule: true,
	default: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'STORE_PROVIDER', props.children);
	},
}));

jest.mock('@/contexts/InitContext', () => ({
	__esModule: true,
	InitContextProvider: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'INIT_CONTEXT', props.children);
	},
}));

jest.mock('@/contexts/initEffects', () => ({
	__esModule: true,
	InitEffects: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'INIT_EFFECTS');
	},
}));

jest.mock('@/contexts/toastContext', () => ({
	__esModule: true,
	ToastContextProvider: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'TOAST_PROVIDER', props.children);
	},
}));

jest.mock('@/components/shared/errorBoundary', () => ({
	__esModule: true,
	ErrorBoundary: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'ERROR_BOUNDARY', props.children);
	},
}));

jest.mock('@/components/shared/sessionExpiredListener/sessionExpiredListener', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'SESSION_EXPIRED_LISTENER');
	},
}));

jest.mock('@/utils/serverTranslations', () => ({
	__esModule: true,
	getServerTranslations: () =>
		Promise.resolve((jest.requireActual('@/translations/fr') as typeof import('@/translations/fr')).fr),
}));

jest.mock('@/contexts/languageContext', () => ({
	__esModule: true,
	LanguageContextProvider: (props: { children?: unknown }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, props.children);
	},
}));

jest.mock('@/components/shared/maintenance/Maintenance', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'MAINTENANCE');
	},
}));

jest.mock('@mui/material-nextjs/v15-appRouter', () => ({
	__esModule: true,
	AppRouterCacheProvider: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'MUI_CACHE', props.children);
	},
}));

jest.mock('@/providers/themeProvider', () => ({
	__esModule: true,
	default: (props: { children?: React.ReactNode }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'THEME_PROVIDER', props.children);
	},
}));

jest.mock('next/headers', () => ({
	__esModule: true,
	cookies: jest.fn().mockImplementation(async () => ({
		get: jest.fn().mockReturnValue(undefined),
	})),
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('RootLayout', () => {
	it('renders children wrapped with providers (session fetched client-side)', async () => {
		let RootLayout: (props: { children: React.ReactNode }) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./layout');
			RootLayout = mod.default;
		});

		const result = await RootLayout!({ children: React.createElement('div', null, 'CHILD_CONTENT') });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);

		expect(html).toContain('SESSION_PROVIDER');
		expect(html).toContain('INIT_EFFECTS');
		expect(html).toContain('TOAST_PROVIDER');
		expect(html).toContain('CHILD_CONTENT');
		// auth() is not called — session is fetched client-side by SessionProvider
		expect(mockAuth).not.toHaveBeenCalled();
	});
});
