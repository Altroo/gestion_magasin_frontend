import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
	'/login',
	'/reset-password',
	'/reset-password/enter-code',
	'/reset-password/set-password',
	'/reset-password/set-password-complete',
];

export default auth((req) => {
	const pathname = req.nextUrl.pathname;

	// allow public paths without redirect
	if (PUBLIC_PATHS.includes(pathname)) {
		return NextResponse.next();
	}
	// settings doesn't have root page
	if (req.nextUrl.pathname === '/dashboard/settings') {
		return NextResponse.redirect(new URL('/dashboard/settings/edit-profile', req.url));
	}

	const token = req.auth?.accessToken;
	const isAuthorized = !!token;

	if (!isAuthorized) {
		return NextResponse.redirect(new URL('/login', req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
