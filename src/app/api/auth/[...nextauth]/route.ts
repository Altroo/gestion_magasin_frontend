import { handlers } from '@/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { addCorsHeaders, getCorsHeaders } from '@/utils/corsHeaders';

async function handler(req: NextRequest, authHandler: (req: NextRequest) => Promise<Response>): Promise<Response> {
	const origin = req.headers.get('origin');
	const response = await authHandler(req);
	return addCorsHeaders(response, origin);
}

export async function GET(req: NextRequest): Promise<Response> {
	return handler(req, handlers.GET);
}

export async function POST(req: NextRequest): Promise<Response> {
	return handler(req, handlers.POST);
}

export async function OPTIONS(req: NextRequest): Promise<Response> {
	const origin = req.headers.get('origin');
	return NextResponse.json(
		{},
		{
			status: 200,
			headers: getCorsHeaders(origin),
		},
	);
}
