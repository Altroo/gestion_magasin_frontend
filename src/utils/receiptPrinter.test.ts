import {
	buildEscPosReceipt,
	buildReceiptText,
	imageDataToEscPosRaster,
	printEscPosReceipt,
	RECEIPT_WIDTH,
} from './receiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';

const sale: SaleType = {
	id: 42,
	store: 7,
	store_name: 'Vape & More',
	seller_email: 'caisse@example.com',
	payment_mode: 1,
	payment_mode_name: 'Espèces',
	status: 'confirmed',
	payment_status: 'paid',
	sale_type: 'normal',
	subtotal: '250.00',
	discount_amount: '10.00',
	total: '240.00',
	paid_amount: '250.00',
	change_amount: '10.00',
	date_created: '2026-09-01T14:30:00Z',
	lines: [
		{
			id: 1,
			product: 9,
			product_name: 'Produit mentholé avec un nom très long',
			product_reference: 'REF-9',
			product_barcode: '6111122233344',
			quantity: '2.000',
			unit_price: '100.00',
			total: '200.00',
		},
	],
	promotion_lines: [
		{
			id: 2,
			promotion: 3,
			promotion_name: 'Pack été',
			quantity: '1.000',
			unit_price: '50.00',
			total: '50.00',
		},
	],
};

describe('receiptPrinter', () => {
	it('builds a compact 58 mm ticket with sale totals and normalized text', () => {
		const ticket = buildReceiptText(sale, {
			storeName: 'Vape & More',
			storeAddress: 'Casablanca, Maroc',
			storePhone: '05 22 00 00 00',
		});

		expect(ticket).toContain('Ticket #42');
		expect(ticket).toContain('Produit menthole');
		expect(ticket).toContain('Especes');
		expect(ticket).toContain('TOTAL');
		expect(ticket).toContain('240.00 DH');
		expect(ticket.split('\n').every((line) => line.length <= RECEIPT_WIDTH)).toBe(true);
	});

	it('wraps the ticket in ESC/POS initialize and cut commands', () => {
		const bytes = buildEscPosReceipt(sale, { storeName: sale.store_name });

		expect(Array.from(bytes.slice(0, 2))).toEqual([0x1b, 0x40]);
		expect(Array.from(bytes.slice(-4))).toEqual([0x1d, 0x56, 0x41, 0x00]);
	});

	it('converts a monochrome logo to the ESC/POS raster command', () => {
		const pixels = new Uint8ClampedArray([
			0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0,
			255, 255, 255, 255, 255,
		]);
		const command = imageDataToEscPosRaster(pixels, 8, 1);

		expect(Array.from(command.slice(0, 8))).toEqual([0x1d, 0x76, 0x30, 0x00, 0x01, 0x00, 0x01, 0x00]);
		expect(command[8]).toBe(0b10101010);
	});

	it('prints the text ticket when the configured logo cannot be loaded', async () => {
		const write = jest.fn().mockResolvedValue(undefined);
		const releaseLock = jest.fn();
		const originalFetch = globalThis.fetch;
		globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('logo unavailable'));
		const port = {
			open: jest.fn(),
			close: jest.fn(),
			writable: {
				getWriter: () => ({ write, releaseLock }),
			} as unknown as WritableStream<Uint8Array>,
		};

		try {
			await expect(
				printEscPosReceipt(port, sale, {
					storeName: sale.store_name,
					logoUrl: 'https://api.example.test/stores/7/logo/',
				}),
			).resolves.toBeUndefined();

			expect(write).toHaveBeenCalledTimes(1);
			expect(releaseLock).toHaveBeenCalledTimes(1);
		} finally {
			if (originalFetch) globalThis.fetch = originalFetch;
			else delete (globalThis as { fetch?: typeof fetch }).fetch;
		}
	});
});
