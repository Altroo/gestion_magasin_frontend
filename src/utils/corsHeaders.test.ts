/**
 * @jest-environment node
 */
import { getCorsHeaders, addCorsHeaders } from './corsHeaders';

describe('getCorsHeaders', () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...OLD_ENV };
	});

	afterAll(() => {
		process.env = OLD_ENV;
	});

	it('always includes CORS method, header, and credential headers', () => {
		const headers = getCorsHeaders('http://localhost:3006');
		expect(headers).toMatchObject({
			'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
		});
	});

	it('sets Allow-Origin for a matching allowed origin (localhost in test env)', () => {
		process.env.ALLOWED_ORIGINS = 'http://localhost:3006';
		const headers = getCorsHeaders('http://localhost:3006') as Record<string, string>;
		expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3006');
	});

	it('does not set Allow-Origin for an unknown origin', () => {
		const headers = getCorsHeaders('https://unknown.example.com') as Record<string, string>;
		expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
	});

	it('does not set Allow-Origin when origin is null', () => {
		const headers = getCorsHeaders(null) as Record<string, string>;
		expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
	});
});

describe('addCorsHeaders', () => {
	it('returns a new Response with CORS headers added', () => {
		process.env.ALLOWED_ORIGINS = 'http://localhost:3006';
		const original = new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});

		const result = addCorsHeaders(original, 'http://localhost:3006');

		expect(result.status).toBe(200);
		expect(result.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, PUT, PATCH, POST, DELETE');
		expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
		expect(result.headers.get('Content-Type')).toBe('application/json');
	});

	it('preserves existing response body', async () => {
		const body = JSON.stringify({ data: 'hello' });
		const original = new Response(body, { status: 201 });
		const result = addCorsHeaders(original, null);
		expect(result.status).toBe(201);
		expect(await result.json()).toEqual({ data: 'hello' });
	});
});
