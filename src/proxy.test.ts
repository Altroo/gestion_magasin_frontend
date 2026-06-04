import { jest } from '@jest/globals';

// Minimal types used by the tests
type NextUrlLike = { pathname: string };
type ReqLike = {
	nextUrl: NextUrlLike;
	url: string;
	auth?: { accessToken?: string | null } | null;
};

const NEXT_NEXT_SENTINEL = Symbol('next');
const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });

// --- Mocks ---
// Mock NextResponse to control .next() and .redirect()
jest.mock(
	'next/server',
	() => {
		return {
			__esModule: true,
			NextResponse: {
				next: jest.fn(() => NEXT_NEXT_SENTINEL),
				redirect: jest.fn((url: URL) => REDIRECT_SENTINEL(url.toString())),
			},
		};
	},
	{ virtual: false },
);

// Mock the auth wrapper to be a pass-through
jest.mock(
	'@/auth',
	() => {
		return {
			__esModule: true,
			auth: (handler: (req: ReqLike) => unknown) => handler,
		};
	},
	{ virtual: false },
);

// Now require the module under test AFTER mocks are registered
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextServer = require('next/server') as {
	NextResponse: { next: jest.Mock; redirect: jest.Mock };
};
const NextResponse = nextServer.NextResponse;

let middlewareHandler: (req: ReqLike) => unknown;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require('./proxy');
// eslint-disable-next-line prefer-const
middlewareHandler = mod.default as (req: ReqLike) => unknown;

beforeEach(() => {
	jest.clearAllMocks();
});

describe('auth middleware handler', () => {
	it('allows public paths without redirect', () => {
		const req: ReqLike = { nextUrl: { pathname: '/login' }, url: 'https://example.com/login', auth: null };

		const result = middlewareHandler(req);

		expect(NextResponse.next).toHaveBeenCalled();
		expect(result).toBe(NEXT_NEXT_SENTINEL);
	});

	it('redirects /dashboard/settings to edit-profile', () => {
		const req: ReqLike = {
			nextUrl: { pathname: '/dashboard/settings' },
			url: 'https://example.com/dashboard/settings',
			auth: null,
		};

		const result = middlewareHandler(req);

		expect(NextResponse.redirect).toHaveBeenCalled();
		const redirectCall = NextResponse.redirect.mock.calls[0][0] as URL;
		expect(redirectCall.pathname).toBe('/dashboard/settings/edit-profile');
		expect(result).toEqual(REDIRECT_SENTINEL(new URL('/dashboard/settings/edit-profile', req.url).toString()));
	});

	it('redirects to /login when no access token present', () => {
		const req: ReqLike = { nextUrl: { pathname: '/dashboard' }, url: 'https://example.com/dashboard', auth: {} };

		const result = middlewareHandler(req);

		expect(NextResponse.redirect).toHaveBeenCalled();
		const redirectCall = NextResponse.redirect.mock.calls[0][0] as URL;
		expect(redirectCall.pathname).toBe('/login');
		expect(result).toEqual(REDIRECT_SENTINEL(new URL('/login', req.url).toString()));
	});

	it('allows request when access token present', () => {
		const req: ReqLike = {
			nextUrl: { pathname: '/dashboard' },
			url: 'https://example.com/dashboard',
			auth: { accessToken: 'token-123' },
		};

		const result = middlewareHandler(req);

		expect(NextResponse.next).toHaveBeenCalled();
		expect(result).toBe(NEXT_NEXT_SENTINEL);
	});

	it('treats listed public paths exact match only', () => {
		const req: ReqLike = { nextUrl: { pathname: '/login/extra' }, url: 'https://example.com/login/extra', auth: null };

		const result = middlewareHandler(req);

		expect(NextResponse.redirect).toHaveBeenCalled();
		const redirectCall = NextResponse.redirect.mock.calls[0][0] as URL;
		expect(redirectCall.pathname).toBe('/login');
		expect(result).toEqual(REDIRECT_SENTINEL(new URL('/login', req.url).toString()));
	});
});
