import { act, renderHook } from '@testing-library/react';
import { useSerialReceiptPrinter } from './useSerialReceiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';

const sale: SaleType = {
	id: 1,
	store: 1,
	store_name: 'Test Store',
	status: 'confirmed',
	payment_status: 'paid',
	sale_type: 'normal',
	subtotal: '10.00',
	discount_amount: '0.00',
	total: '10.00',
	paid_amount: '10.00',
	change_amount: '0.00',
	date_created: '2026-09-01T12:00:00Z',
	lines: [],
	promotion_lines: [],
};

describe('useSerialReceiptPrinter', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('opens a user-selected port and writes one ESC/POS ticket', async () => {
		const write = jest.fn().mockResolvedValue(undefined);
		const releaseLock = jest.fn();
		const writable = { getWriter: () => ({ write, releaseLock }) };
		const port = {
			readable: null,
			writable: null as typeof writable | null,
			open: jest.fn().mockImplementation(async () => {
				port.writable = writable;
			}),
			close: jest.fn().mockResolvedValue(undefined),
		};
		const serial = {
			requestPort: jest.fn().mockResolvedValue(port),
			getPorts: jest.fn().mockResolvedValue([]),
		};
		Object.defineProperty(navigator, 'serial', { configurable: true, value: serial });

		const { result } = renderHook(() => useSerialReceiptPrinter());
		await act(async () => {
			expect(await result.current.connect()).toBe(true);
		});

		expect(port.open).toHaveBeenCalledWith({ baudRate: 9600 });
		expect(result.current.isConnected).toBe(true);

		await act(async () => {
			await result.current.printReceipt(sale, { storeName: sale.store_name });
		});
		expect(write).toHaveBeenCalledTimes(1);
		expect(write.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
		expect(releaseLock).toHaveBeenCalledTimes(1);
	});

	it('reports unsupported when the Web Serial API is unavailable', () => {
		Reflect.deleteProperty(navigator, 'serial');
		const { result } = renderHook(() => useSerialReceiptPrinter());
		expect(result.current.status).toBe('unsupported');
	});
});
