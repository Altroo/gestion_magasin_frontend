import { act, renderHook } from '@testing-library/react';
import { useReceiptPrinter } from './useReceiptPrinter';
import { printBrowserReceipt } from '@/utils/receiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';

jest.mock('@/utils/receiptPrinter', () => ({
	...jest.requireActual('@/utils/receiptPrinter'),
	printBrowserReceipt: jest.fn(),
}));

const mockedPrintBrowserReceipt = jest.mocked(printBrowserReceipt);
const sale = {
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
} as SaleType;

describe('useReceiptPrinter', () => {
	beforeEach(() => mockedPrintBrowserReceipt.mockReset());

	it('prints through the installed system printer without a serial connection', async () => {
		mockedPrintBrowserReceipt.mockResolvedValue(undefined);
		const { result } = renderHook(() => useReceiptPrinter());

		expect(result.current.status).toBe('ready');
		expect(result.current.isReady).toBe(true);
		await act(async () => {
			await result.current.printReceipt(sale, { storeName: sale.store_name });
		});

		expect(mockedPrintBrowserReceipt).toHaveBeenCalledWith(sale, { storeName: sale.store_name });
		expect(result.current.status).toBe('ready');
	});
});
