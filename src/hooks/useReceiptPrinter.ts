'use client';

import { useCallback, useState } from 'react';
import { printBrowserReceipt, type ReceiptPrinterDetails } from '@/utils/receiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';

export type ReceiptPrinterStatus = 'ready' | 'printing' | 'error';

export const useReceiptPrinter = () => {
	const [status, setStatus] = useState<ReceiptPrinterStatus>('ready');

	const printReceipt = useCallback(async (sale: SaleType, details: ReceiptPrinterDetails) => {
		setStatus('printing');
		try {
			await printBrowserReceipt(sale, details);
			setStatus('ready');
		} catch (error) {
			setStatus('error');
			throw error;
		}
	}, []);

	return {
		status,
		autoPrint: true,
		isReady: status !== 'printing',
		printReceipt,
	};
};
