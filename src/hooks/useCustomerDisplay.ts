'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isCaisseDeviceConfigured, postCaisseDeviceCommand } from '@/utils/customerDisplay';

const UPDATE_DELAY_MS = 80;

const sendTotal = (total: number) => postCaisseDeviceCommand('/display', Math.max(0, total).toFixed(2));

export const useCustomerDisplay = (total: number) => {
	const [enabled] = useState(isCaisseDeviceConfigured);
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
