import { NextResponse } from 'next/server';
import { CUSTOMER_DISPLAY_COOKIE, CUSTOMER_DISPLAY_COOKIE_VALUE } from '@/utils/customerDisplay';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
	const siteUrl = process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX || request.url;
	const response = NextResponse.redirect(new URL('/dashboard/caise', siteUrl));
	response.cookies.set(CUSTOMER_DISPLAY_COOKIE, CUSTOMER_DISPLAY_COOKIE_VALUE, {
		path: '/',
		maxAge: ONE_YEAR_SECONDS,
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	});
	return response;
}
