import type { NextRequest } from 'next/server';

const mockCookieStore = {
	set: jest.fn(),
	delete: jest.fn(),
};

const mockAddCorsHeaders = jest.fn((response: unknown) => response);
const mockNextResponseJson = jest.fn((data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
	json: () => Promise.resolve(data),
	data,
	status: init?.status || 200,
	headers: init?.headers || {},
})) as jest.Mock;

jest.mock('next/headers', () => ({
	get cookies() {
		return () => Promise.resolve(mockCookieStore);
	},
}));

jest.mock('@/utils/corsHeaders', () => ({
	get addCorsHeaders() {
		return mockAddCorsHeaders;
	},
}));

jest.mock('next/server', () => ({
	get NextResponse() {
		return { json: mockNextResponseJson };
	},
}));

import { OPTIONS, POST, GET, DELETE } from './route';

const createMockRequest = (
	method: string,
	body?: Record<string, unknown>,
	origin?: string,
	cookies?: Record<string, string>,
): NextRequest =>
	({
		method,
		headers: {
			get: jest.fn((name: string) => (name === 'origin' ? origin || null : null)),
		},
		cookies: cookies || {},
		json: body
			? jest.fn().mockResolvedValue(body)
			: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
	}) as unknown as NextRequest;

describe('Cookies Route Handlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCookieStore.set.mockClear();
		mockCookieStore.delete.mockClear();
	});

	describe('OPTIONS handler', () => {
		it('returns 200 with CORS headers', async () => {
			const mockResponse = { data: {}, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await OPTIONS(createMockRequest('OPTIONS', undefined, 'http://localhost:3006'));

			expect(mockNextResponseJson).toHaveBeenCalledWith({}, { status: 200 });
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3006');
			expect(result).toBe(mockResponse);
		});
	});

	describe('POST handler', () => {
		it('sets new_email cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await POST(createMockRequest('POST', { new_email: 'test@example.com', maxAge: 3600 }, 'http://localhost:3006'));

			expect(mockCookieStore.set).toHaveBeenCalledWith(
				'@new_email',
				'test@example.com',
				expect.objectContaining({ maxAge: 3600, httpOnly: true, path: '/', sameSite: 'lax' }),
			);
		});

		it('sets code cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await POST(createMockRequest('POST', { code: '123456', maxAge: 300 }, 'http://localhost:3006'));

			expect(mockCookieStore.set).toHaveBeenCalledWith(
				'@code',
				'123456',
				expect.objectContaining({ maxAge: 300 }),
			);
		});

		it('sets pass_updated cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await POST(createMockRequest('POST', { pass_updated: 'true', maxAge: 60 }, 'http://localhost:3006'));

			expect(mockCookieStore.set).toHaveBeenCalledWith('@pass_updated', 'true', expect.objectContaining({ maxAge: 60 }));
		});

		it('sets multiple cookies at once', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await POST(createMockRequest('POST', { new_email: 'a@b.com', code: '111', maxAge: 3600 }, 'http://localhost:3006'));

			expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
			expect(mockCookieStore.set).toHaveBeenCalledWith('@new_email', 'a@b.com', expect.any(Object));
			expect(mockCookieStore.set).toHaveBeenCalledWith('@code', '111', expect.any(Object));
		});

		it('returns 400 for invalid payload (no allowed keys)', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid payload' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await POST(createMockRequest('POST', { bad_key: 'value' }, 'http://localhost:3006'));

			expect(mockCookieStore.set).not.toHaveBeenCalled();
			expect(mockNextResponseJson).toHaveBeenCalledWith({ success: false, error: 'Invalid payload' }, { status: 400 });
			expect(result.status).toBe(400);
		});

		it('returns 400 for invalid JSON', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid JSON' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await POST(createMockRequest('POST', undefined, 'http://localhost:3006'));

			expect(result.status).toBe(400);
		});
	});

	describe('GET handler', () => {
		it('returns cookies from request', async () => {
			const mockCookies = { '@new_email': 'test@example.com' };
			const mockResponse = { data: { cookies: mockCookies }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await GET(createMockRequest('GET', undefined, 'http://localhost:3006', mockCookies));

			expect(mockNextResponseJson).toHaveBeenCalledWith({ cookies: mockCookies }, { status: 200 });
			expect(result.status).toBe(200);
		});

		it('handles request without origin', async () => {
			const mockResponse = { data: { cookies: {} }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await GET(createMockRequest('GET', undefined, undefined, {}));
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, null);
		});
	});

	describe('DELETE handler', () => {
		it('deletes @new_email cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await DELETE(createMockRequest('DELETE', { new_email: true }, 'http://localhost:3006'));
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@new_email');
		});

		it('deletes @code cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await DELETE(createMockRequest('DELETE', { code: true }, 'http://localhost:3006'));
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@code');
		});

		it('deletes @pass_updated cookie', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await DELETE(createMockRequest('DELETE', { pass_updated: true }, 'http://localhost:3006'));
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@pass_updated');
		});

		it('deletes multiple cookies', async () => {
			const mockResponse = { data: { success: true }, status: 200 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await DELETE(createMockRequest('DELETE', { new_email: true, code: true }, 'http://localhost:3006'));

			expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@new_email');
			expect(mockCookieStore.delete).toHaveBeenCalledWith('@code');
		});

		it('returns 400 when no valid keys to delete', async () => {
			const mockResponse = { data: { success: false }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await DELETE(createMockRequest('DELETE', { bad_key: true }, 'http://localhost:3006'));
			expect(mockCookieStore.delete).not.toHaveBeenCalled();
			expect(result.status).toBe(400);
		});

		it('returns 400 for invalid JSON', async () => {
			const mockResponse = { data: { success: false, error: 'Invalid JSON' }, status: 400 };
			mockNextResponseJson.mockReturnValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const result = await DELETE(createMockRequest('DELETE', undefined, 'http://localhost:3006'));
			expect(result.status).toBe(400);
		});
	});
});
