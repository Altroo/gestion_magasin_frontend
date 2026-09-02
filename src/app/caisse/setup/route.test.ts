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
	beforeEach(() => jest.clearAllMocks());

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
});
