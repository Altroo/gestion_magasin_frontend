'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	DEFAULT_PRINTER_BAUD_RATE,
	printEscPosReceipt,
	type ReceiptPrinterDetails,
	type SerialPortLike,
	type WebSerialLike,
} from '@/utils/receiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';

const PRINTER_GRANTED_KEY = 'gestion-magasin:receipt-printer-granted';

export type ReceiptPrinterStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

const getSerial = () => {
	if (typeof navigator === 'undefined' || !('serial' in navigator)) return undefined;
	return (navigator as Navigator & { serial: WebSerialLike }).serial;
};

export const useSerialReceiptPrinter = () => {
	const portRef = useRef<SerialPortLike | null>(null);
	const [status, setStatus] = useState<ReceiptPrinterStatus>(() => (getSerial() ? 'disconnected' : 'unsupported'));

	const openPort = useCallback(async (port: SerialPortLike) => {
		setStatus('connecting');
		try {
			if (!port.readable && !port.writable) {
				await port.open({ baudRate: DEFAULT_PRINTER_BAUD_RATE });
			}
			portRef.current = port;
			window.localStorage.setItem(PRINTER_GRANTED_KEY, 'true');
			setStatus('connected');
			return true;
		} catch {
			portRef.current = null;
			setStatus('error');
			return false;
		}
	}, []);

	const connect = useCallback(async () => {
		const serial = getSerial();
		if (!serial) {
			setStatus('unsupported');
			return false;
		}
		try {
			const port = await serial.requestPort();
			return await openPort(port);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'NotFoundError') {
				setStatus('disconnected');
				return false;
			}
			setStatus('error');
			return false;
		}
	}, [openPort]);

	const disconnect = useCallback(async () => {
		const port = portRef.current;
		portRef.current = null;
		try {
			if (port?.readable || port?.writable) {
				await port.close();
			}
		} finally {
			setStatus(getSerial() ? 'disconnected' : 'unsupported');
		}
	}, []);

	const printReceipt = useCallback(async (sale: SaleType, details: ReceiptPrinterDetails) => {
		const port = portRef.current;
		if (!port) {
			throw new Error('SERIAL_PRINTER_NOT_CONNECTED');
		}
		setStatus('printing');
		try {
			await printEscPosReceipt(port, sale, details);
			setStatus('connected');
		} catch (error) {
			setStatus('error');
			throw error;
		}
	}, []);

	useEffect(() => {
		const serial = getSerial();
		if (!serial || window.localStorage.getItem(PRINTER_GRANTED_KEY) !== 'true') return;
		let cancelled = false;
		void serial.getPorts().then(async (ports) => {
			if (!cancelled && ports[0]) {
				await openPort(ports[0]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [openPort]);

	return {
		status,
		baudRate: DEFAULT_PRINTER_BAUD_RATE,
		autoPrint: true,
		isConnected: status === 'connected' || status === 'printing',
		connect,
		disconnect,
		printReceipt,
	};
};
