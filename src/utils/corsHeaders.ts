const parseOrigins = (value?: string) => value?.split(',').map(o => o.trim()).filter(Boolean) ?? [];

const getAllowedOrigins = () => [
	...parseOrigins(process.env.ALLOWED_ORIGINS),
	...parseOrigins(process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX),
];

export const getCorsHeaders = (origin: string | null): HeadersInit => {
	const headers: HeadersInit = {
		'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
	};

	if (origin && getAllowedOrigins().includes(origin)) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	return headers;
};

export function addCorsHeaders(response: Response, origin: string | null): Response {
	const corsHeaders = getCorsHeaders(origin);
	const headers = new Headers(response.headers);

	Object.entries(corsHeaders).forEach(([key, value]) => {
		headers.set(key, value as string);
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
