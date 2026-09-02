import {
	CUSTOMER_DISPLAY_COOKIE,
	CUSTOMER_DISPLAY_COOKIE_VALUE,
	openCashDrawer,
	requestCaisseWindowAction,
} from './customerDisplay';

const fetchMock = jest.fn();

describe('customerDisplay device commands', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		fetchMock.mockResolvedValue({ ok: true });
		Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchMock });
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=; Max-Age=0; Path=/`;
	});

	it('does not contact the local device helper outside an installed caisse profile', async () => {
		await expect(openCashDrawer(123)).resolves.toBe(false);
		await expect(requestCaisseWindowAction('close')).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('sends only a valid sale identifier to the drawer endpoint', async () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;

		await expect(openCashDrawer(123)).resolves.toBe(true);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://127.0.0.1:37821/drawer',
			expect.objectContaining({ method: 'POST', body: '123', cache: 'no-store', keepalive: true }),
		);

		fetchMock.mockClear();
		await expect(openCashDrawer(0)).resolves.toBe(false);
		await expect(openCashDrawer(1.5)).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each([
		['minimize', '/window/minimize'],
		['close', '/window/close'],
	] as const)('sends the %s window action to its fixed endpoint', async (action, path) => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;

		await expect(requestCaisseWindowAction(action)).resolves.toBe(true);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://127.0.0.1:37821${path}`,
			expect.objectContaining({ method: 'POST', body: action, cache: 'no-store', keepalive: true }),
		);
	});
});
