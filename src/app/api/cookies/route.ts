import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addCorsHeaders } from '@/utils/corsHeaders';

export async function OPTIONS(request: NextRequest) {
	const origin = request.headers.get('origin');
	return addCorsHeaders(NextResponse.json({}, { status: 200 }), origin);
}

export async function POST(request: NextRequest) {
	const origin = request.headers.get('origin');

	try {
		const body = await request.json();

		const baseOptions = {
			httpOnly: true,
			secure: process.env.NODE_ENV !== 'development',
			path: '/',
			sameSite: 'lax' as const,
		};

		const cookieStore = await cookies();

		const allowedKeys: Record<string, string> = {
			new_email: '@new_email',
			code: '@code',
			pass_updated: '@pass_updated',
		};

		let success = false;

		for (const [key, cookieName] of Object.entries(allowedKeys)) {
			if (key in body) {
				const value = body[key];
				cookieStore.set(cookieName, value, {
					maxAge: body.maxAge,
					...baseOptions,
				});
				success = true;
			}
		}

		if (success) {
			return addCorsHeaders(NextResponse.json({ success: true }), origin);
		}

		return addCorsHeaders(NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 }), origin);
	} catch {
		return addCorsHeaders(NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }), origin);
	}
}

export async function GET(request: NextRequest) {
	const origin = request.headers.get('origin');
	return addCorsHeaders(NextResponse.json({ cookies: request.cookies }, { status: 200 }), origin);
}

export async function DELETE(request: NextRequest) {
	const origin = request.headers.get('origin');

	try {
		const body = await request.json();
		const cookieStore = await cookies();

		const validKeys = ['@new_email', '@code', '@pass_updated'];
		let deleted = false;

		for (const key of validKeys) {
			if (key.slice(1) in body) {
				cookieStore.delete(key);
				deleted = true;
			}
		}

		return addCorsHeaders(NextResponse.json({ success: deleted }, { status: deleted ? 200 : 400 }), origin);
	} catch {
		return addCorsHeaders(NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }), origin);
	}
}
