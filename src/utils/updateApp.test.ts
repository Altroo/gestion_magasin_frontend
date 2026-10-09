import { APP_UPDATE_PARAM, getAppUpdateUrl } from './updateApp';

const mockFetch = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => {
	global.fetch = mockFetch;
	mockFetch.mockReset();
	jest.spyOn(AbortSignal, 'timeout').mockReturnValue(new AbortController().signal);
});
afterEach(() => {
	global.fetch = originalFetch;
	jest.restoreAllMocks();
});

it('verifies the deployed frontend before a cache-busted navigation preserving route, filters and hash', async () => {
	mockFetch.mockResolvedValue({ ok: true, json: async () => ({ version: '1.10.0' }) });
	const url = new URL(await getAppUpdateUrl('1.9.0', 'https://app.test/dashboard/board?project=2#card'));
	expect(url.pathname).toBe('/dashboard/board');
	expect(url.searchParams.get('project')).toBe('2');
	expect(url.searchParams.get(APP_UPDATE_PARAM)).toMatch(/^1\.9\.0-\d+$/);
	expect(url.hash).toBe('#card');
	expect(mockFetch).toHaveBeenCalledWith(
		expect.stringMatching(/^\/api\/app-version\?check=/),
		expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
	);
});

it.each([{ version: '1.0.0' }, { version: 'invalid' }, {}, null])(
	'rejects unavailable or invalid releases: %s',
	async (data) => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => data });
		await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).rejects.toThrow();
	},
);
it('does not navigate after an offline/HTTP failure', async () => {
	mockFetch.mockRejectedValueOnce(new Error('offline'));
	await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).rejects.toThrow('offline');
	mockFetch.mockResolvedValueOnce({ ok: false });
	await expect(getAppUpdateUrl('2.0.0', 'https://app.test/')).rejects.toThrow();
});
it('does not fetch an invalid target', async () => {
	await expect(getAppUpdateUrl('bad', 'https://app.test/')).rejects.toThrow();
	expect(mockFetch).not.toHaveBeenCalled();
});
