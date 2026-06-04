import type { NextRequest } from 'next/server';

const mockHandlersGET = jest.fn();
const mockHandlersPOST = jest.fn();
const mockAddCorsHeaders = jest.fn((response: unknown) => response);
const mockGetCorsHeaders = jest.fn((origin: string | null) => ({
	'Access-Control-Allow-Origin': origin || '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})) as jest.Mock;
const mockNextResponseJson = jest.fn((data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
	data,
	status: init?.status || 200,
	headers: init?.headers || {},
}));

jest.mock('@/auth', () => ({
	get handlers() {
		return { GET: mockHandlersGET, POST: mockHandlersPOST };
	},
}));

jest.mock('@/utils/corsHeaders', () => ({
	get addCorsHeaders() {
		return mockAddCorsHeaders;
	},
	get getCorsHeaders() {
		return mockGetCorsHeaders;
	},
}));

jest.mock('next/server', () => ({
	get NextResponse() {
		return { json: mockNextResponseJson };
	},
}));

import { GET, POST, OPTIONS } from './route';

const createMockRequest = (method: string, origin?: string): NextRequest =>
	({
		method,
		headers: {
			get: jest.fn((name: string) => (name === 'origin' ? origin || null : null)),
		},
	}) as unknown as NextRequest;

describe('NextAuth Route Handlers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET handler', () => {
		it('calls handlers.GET and adds CORS headers', async () => {
			const mockResponse = { status: 200 };
			mockHandlersGET.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const req = createMockRequest('GET', 'http://localhost:3001');
			const result = await GET(req);

			expect(mockHandlersGET).toHaveBeenCalledWith(req);
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3001');
			expect(result).toBe(mockResponse);
		});

		it('handles request without origin header', async () => {
			const mockResponse = { status: 200 };
			mockHandlersGET.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			await GET(createMockRequest('GET'));
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, null);
		});
	});

	describe('POST handler', () => {
		it('calls handlers.POST and adds CORS headers', async () => {
			const mockResponse = { status: 200, body: '{"token":"abc"}' };
			mockHandlersPOST.mockResolvedValueOnce(mockResponse);
			mockAddCorsHeaders.mockReturnValueOnce(mockResponse);

			const req = createMockRequest('POST', 'http://localhost:3001');
			const result = await POST(req);

			expect(mockHandlersPOST).toHaveBeenCalledWith(req);
			expect(mockAddCorsHeaders).toHaveBeenCalledWith(mockResponse, 'http://localhost:3001');
			expect(result).toBe(mockResponse);
		});
	});

	describe('OPTIONS handler', () => {
		it('returns 200 with CORS headers', async () => {
			const corsHeaders = {
				'Access-Control-Allow-Origin': 'http://localhost:3001',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			};
			mockGetCorsHeaders.mockReturnValueOnce(corsHeaders);
			mockNextResponseJson.mockReturnValueOnce({ data: {}, status: 200, headers: corsHeaders });

			const req = createMockRequest('OPTIONS', 'http://localhost:3001');
			const result = await OPTIONS(req);

			expect(mockGetCorsHeaders).toHaveBeenCalledWith('http://localhost:3001');
			expect(mockNextResponseJson).toHaveBeenCalledWith({}, { status: 200, headers: corsHeaders });
			expect(result).toEqual({ data: {}, status: 200, headers: corsHeaders });
		});

		it('handles missing origin header', async () => {
			const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
			mockGetCorsHeaders.mockReturnValueOnce(corsHeaders);

			await OPTIONS(createMockRequest('OPTIONS'));
			expect(mockGetCorsHeaders).toHaveBeenCalledWith(null);
		});
	});
});
