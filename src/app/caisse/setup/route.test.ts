import { CUSTOMER_DISPLAY_COOKIE, CUSTOMER_DISPLAY_COOKIE_VALUE } from '@/utils/customerDisplay';

const cookieSet = jest.fn();
const redirect = jest.fn((url: URL) => ({
	status: 307,
	location: url.toString(),
	cookies: { set: cookieSet },
}));

jest.mock('next/server', () => ({
	NextResponse: { redirect: (url: URL) => redirect(url) },
}));

import { GET } from './route';

describe('caisse setup route', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = 'https://gestion-magasin.example.test';
	});

	it('marks the dedicated caisse profile before redirecting to the POS', () => {
		const response = GET({ url: 'https://gestion-magasin.example.test/caisse/setup' } as Request) as unknown as {
			status: number;
			location: string;
		};

		expect(response.status).toBe(307);
		expect(response.location).toBe('https://gestion-magasin.example.test/dashboard/caise');
		expect(cookieSet).toHaveBeenCalledWith(
			CUSTOMER_DISPLAY_COOKIE,
			CUSTOMER_DISPLAY_COOKIE_VALUE,
			expect.objectContaining({ path: '/', maxAge: 365 * 24 * 60 * 60, httpOnly: false, sameSite: 'lax' }),
		);
	});

	it('falls back to the request origin when the public site URL is unavailable', () => {
		process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX = '';

		const response = GET({ url: 'http://localhost:3006/caisse/setup' } as Request) as unknown as {
			location: string;
		};

		expect(response.location).toBe('http://localhost:3006/dashboard/caise');
	});
});
