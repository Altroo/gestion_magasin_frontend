'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
	DEFAULT_PRINTER_BAUD_RATE,
	printEscPosReceipt,
	type ReceiptPrinterDetails,
	type SerialPortLike,
	type WebSerialLike,
} from '@/utils/receiptPrinter';
import type { SaleType } from '@/types/gestionMagasinTypes';
import { runAsyncWithErrorHandler, runWithCleanup } from '@/utils/runWithCleanup';

const PRINTER_GRANTED_KEY = 'gestion-magasin:receipt-printer-granted';

export type ReceiptPrinterStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

const getSerial = () => {
	if (typeof navigator === 'undefined' || !('serial' in navigator)) return undefined;
	return (navigator as Navigator & { serial: WebSerialLike }).serial;
};

export const useSerialReceiptPrinter = () => {
	const portRef = useRef<SerialPortLike | null>(null);
	const [status, setStatus] = useState<ReceiptPrinterStatus>(() => (getSerial() ? 'disconnected' : 'unsupported'));

	const openPort = async (port: SerialPortLike) => {
		setStatus('connecting');
		return await runAsyncWithErrorHandler(
			async () => {
				if (!port.readable && !port.writable) {
					await port.open({ baudRate: DEFAULT_PRINTER_BAUD_RATE });
				}
				portRef.current = port;
				window.localStorage.setItem(PRINTER_GRANTED_KEY, 'true');
				setStatus('connected');
				return true;
			},
			async () => {
				portRef.current = null;
				setStatus('error');
				return false;
			},
		);
	};

	const connect = async () => {
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
	};

	const disconnect = async () => {
		const port = portRef.current;
		portRef.current = null;
		await runWithCleanup(
			async () => {
				if (port?.readable || port?.writable) {
					await port.close();
				}
			},
			() => {
				setStatus(getSerial() ? 'disconnected' : 'unsupported');
			},
		);
	};

	const printReceipt = async (sale: SaleType, details: ReceiptPrinterDetails) => {
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
	};

	const reconnectGrantedPort = useEffectEvent(async (port: SerialPortLike) => {
		await openPort(port);
	});

	useEffect(() => {
		const serial = getSerial();
		if (!serial || window.localStorage.getItem(PRINTER_GRANTED_KEY) !== 'true') return;
		let cancelled = false;
		void serial.getPorts().then(async (ports) => {
			if (!cancelled && ports[0]) {
				await reconnectGrantedPort(ports[0]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

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
