'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	CUSTOMER_DISPLAY_BRIDGE_URL,
	CUSTOMER_DISPLAY_COOKIE,
	CUSTOMER_DISPLAY_COOKIE_VALUE,
} from '@/utils/customerDisplay';

const UPDATE_DELAY_MS = 80;
const REQUEST_TIMEOUT_MS = 30000;

const isCustomerDisplayConfigured = () =>
	document.cookie
		.split(';')
		.map((cookie) => cookie.trim())
		.includes(`${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}`);

const sendTotal = async (total: number) => {
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		await fetch(CUSTOMER_DISPLAY_BRIDGE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: Math.max(0, total).toFixed(2),
			cache: 'no-store',
			keepalive: true,
			signal: controller.signal,
		});
	} catch {
		// The customer display is optional hardware and must never block a sale.
	} finally {
		window.clearTimeout(timeout);
	}
};

export const useCustomerDisplay = (total: number) => {
	const [enabled] = useState(() => typeof document !== 'undefined' && isCustomerDisplayConfigured());
	const latestTotalRef = useRef(total);
	const isFlushingRef = useRef(false);

	const flushLatestTotal = useCallback(async () => {
		if (!enabled || isFlushingRef.current) return;

		isFlushingRef.current = true;
		try {
			let sentTotal: number | undefined;
			do {
				sentTotal = latestTotalRef.current;
				await sendTotal(sentTotal);
			} while (latestTotalRef.current !== sentTotal);
		} finally {
			isFlushingRef.current = false;
		}
	}, [enabled]);

	useEffect(() => {
		if (!enabled || !Number.isFinite(total)) return;
		latestTotalRef.current = total;

		const timeout = window.setTimeout(() => {
			void flushLatestTotal();
		}, UPDATE_DELAY_MS);

		return () => window.clearTimeout(timeout);
	}, [enabled, flushLatestTotal, total]);

	useEffect(
		() => () => {
			if (enabled) {
				latestTotalRef.current = 0;
				void flushLatestTotal();
			}
		},
		[enabled, flushLatestTotal],
	);
};
