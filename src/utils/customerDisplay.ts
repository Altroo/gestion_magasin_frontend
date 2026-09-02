export const CUSTOMER_DISPLAY_COOKIE = 'gestion-magasin-customer-display';
export const CUSTOMER_DISPLAY_COOKIE_VALUE = 'com2';
const CAISSE_DEVICE_BRIDGE_URL = 'http://127.0.0.1:37821';
const REQUEST_TIMEOUT_MS = 30000;

export type CaisseWindowAction = 'minimize' | 'close';

export const isCaisseDeviceConfigured = () =>
	typeof document !== 'undefined' &&
	document.cookie
		.split(';')
		.map((cookie) => cookie.trim())
		.includes(`${CUSTOMER_DISPLAY_COOKIE}=${CUSTOMER_DISPLAY_COOKIE_VALUE}`);

export const postCaisseDeviceCommand = async (path: string, body: string) => {
	if (!isCaisseDeviceConfigured()) return false;

	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(`${CAISSE_DEVICE_BRIDGE_URL}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body,
			cache: 'no-store',
			keepalive: true,
			signal: controller.signal,
		});
		return response.ok;
	} catch {
		return false;
	} finally {
		window.clearTimeout(timeout);
	}
};

export const openCashDrawer = (saleId: number) => {
	if (!Number.isInteger(saleId) || saleId <= 0) return Promise.resolve(false);
	return postCaisseDeviceCommand('/drawer', String(saleId));
};

export const requestCaisseWindowAction = (action: CaisseWindowAction) =>
	postCaisseDeviceCommand(`/window/${action}`, action);
