import { act, renderHook } from '@testing-library/react';
import { useCustomerDisplay } from './useCustomerDisplay';
import { CUSTOMER_DISPLAY_COOKIE, CUSTOMER_DISPLAY_COOKIE_VALUE } from '@/utils/customerDisplay';

const fetchMock = jest.fn();

describe('useCustomerDisplay', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		fetchMock.mockReset();
		fetchMock.mockResolvedValue({ ok: true });
		Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchMock });
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=; Max-Age=0; Path=/`;
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it('does nothing outside an installed caisse profile', () => {
		renderHook(() => useCustomerDisplay(42.5));

		act(() => jest.advanceTimersByTime(100));

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('coalesces changes and sends the latest total to the local bridge', async () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;
		const { rerender } = renderHook(({ total }) => useCustomerDisplay(total), { initialProps: { total: 10 } });

		rerender({ total: 9999 });
		await act(async () => {
			jest.advanceTimersByTime(100);
			await Promise.resolve();
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://127.0.0.1:37821/display',
			expect.objectContaining({ method: 'POST', body: '9999.00', cache: 'no-store' }),
		);
	});

	it('clears the customer display when leaving the caisse', () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;
		const { unmount } = renderHook(() => useCustomerDisplay(25));

		unmount();

		expect(fetchMock).toHaveBeenCalledWith(
			'http://127.0.0.1:37821/display',
			expect.objectContaining({ body: '0.00' }),
		);
	});

	it('sends the newest total after an earlier write is still in flight', async () => {
		document.cookie = `${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}; Path=/`;
		let finishFirstRequest = () => {};
		fetchMock
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishFirstRequest = () => resolve({ ok: true });
					}),
			)
			.mockResolvedValue({ ok: true });
		const { rerender } = renderHook(({ total }) => useCustomerDisplay(total), { initialProps: { total: 10 } });

		await act(async () => jest.advanceTimersByTime(100));
		rerender({ total: 25 });
		await act(async () => jest.advanceTimersByTime(100));
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await act(async () => {
			finishFirstRequest();
			await Promise.resolve();
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ body: '25.00' }));
	});
});
