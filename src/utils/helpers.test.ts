import { hexToRGB, formatDate, formatLocalDate, formatNumber, parseNumber, setFormikAutoErrors } from './helpers';
import type { InternalAxiosRequestConfig } from 'axios';

// ─── hexToRGB ────────────────────────────────────────────────────────────────

describe('hexToRGB', () => {
	it('converts hex to rgb without alpha', () => {
		expect(hexToRGB('#ffffff')).toBe('rgb(255, 255, 255)');
	});

	it('converts hex to rgb with alpha', () => {
		expect(hexToRGB('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
	});

	it('converts mid-range colour', () => {
		expect(hexToRGB('#0d070b')).toBe('rgb(13, 7, 11)');
	});
});

// ─── formatDate ──────────────────────────────────────────────────────────────

describe('formatDate', () => {
	it('returns "—" for null', () => {
		expect(formatDate(null)).toBe('—');
	});

	it('returns "—" for empty string', () => {
		expect(formatDate('')).toBe('—');
	});

	it('returns "—" for an invalid date string', () => {
		expect(formatDate('not-a-date')).toBe('—');
	});

	it('returns a formatted string for a valid ISO date', () => {
		const result = formatDate('2024-01-15T10:30:00Z');
		expect(typeof result).toBe('string');
		expect(result).not.toBe('—');
		expect(result).toContain('2024');
	});
});

// ─── formatLocalDate ─────────────────────────────────────────────────────────

describe('formatLocalDate', () => {
	it('returns YYYY-MM-DD format', () => {
		const date = new Date(2024, 0, 5); // Jan 5, 2024
		expect(formatLocalDate(date)).toBe('2024-01-05');
	});

	it('pads month and day with leading zeros', () => {
		const date = new Date(2024, 8, 3); // Sep 3, 2024
		expect(formatLocalDate(date)).toBe('2024-09-03');
	});
});

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
	it('returns "0,00" for null', () => {
		expect(formatNumber(null)).toBe('0,00');
	});

	it('returns "0,00" for undefined', () => {
		expect(formatNumber(undefined)).toBe('0,00');
	});

	it('returns "0,00" for non-numeric string', () => {
		expect(formatNumber('abc')).toBe('0,00');
	});

	it('formats a number value', () => {
		const result = formatNumber(1234.5);
		expect(result).toContain('1');
		expect(result).toContain('234');
	});

	it('formats a string number value', () => {
		const result = formatNumber('9999.99');
		expect(result).toContain('9');
	});
});

// ─── parseNumber ─────────────────────────────────────────────────────────────

describe('parseNumber', () => {
	it('returns the number as-is when passed a finite number', () => {
		expect(parseNumber(42)).toBe(42);
	});

	it('returns null for Infinity', () => {
		expect(parseNumber(Infinity)).toBeNull();
	});

	it('parses a valid numeric string', () => {
		expect(parseNumber('3.14')).toBe(3.14);
	});

	it('parses a string with comma decimal separator', () => {
		expect(parseNumber('1,5')).toBe(1.5);
	});

	it('returns null for empty string', () => {
		expect(parseNumber('')).toBeNull();
	});

	it('returns null for string ending with dot', () => {
		expect(parseNumber('3.')).toBeNull();
	});

	it('returns null for non-numeric string', () => {
		expect(parseNumber('abc')).toBeNull();
	});
});

// ─── setFormikAutoErrors ─────────────────────────────────────────────────────

describe('setFormikAutoErrors', () => {
	it('sets field error for each detail field', () => {
		const setFieldError = jest.fn();
		setFormikAutoErrors({
			e: {
				error: {
					status_code: 400,
					message: 'Validation failed',
					details: { email: ['Invalid email'], name: ['Too short'] },
				},
			},
			setFieldError,
		});
		expect(setFieldError).toHaveBeenCalledWith('email', 'Invalid email');
		expect(setFieldError).toHaveBeenCalledWith('name', 'Too short');
	});

	it('maps "error" key to globalError', () => {
		const setFieldError = jest.fn();
		setFormikAutoErrors({
			e: {
				error: {
					status_code: 400,
					message: 'Bad request',
					details: { error: ['Something went wrong'] },
				},
			},
			setFieldError,
		});
		expect(setFieldError).toHaveBeenCalledWith('globalError', 'Something went wrong');
	});

	it('maps "detail" key to globalError', () => {
		const setFieldError = jest.fn();
		setFormikAutoErrors({
			e: {
				error: {
					status_code: 403,
					message: 'Forbidden',
					details: { detail: 'Access denied' },
				},
			},
			setFieldError,
		});
		expect(setFieldError).toHaveBeenCalledWith('globalError', 'Access denied');
	});

	it('does nothing when payload has no details', () => {
		const setFieldError = jest.fn();
		setFormikAutoErrors({ e: {}, setFieldError });
		expect(setFieldError).not.toHaveBeenCalled();
	});
});

// ─── handleUnauthorized ──────────────────────────────────────────────────────

jest.mock('next-auth/react', () => ({
	getSession: jest.fn().mockResolvedValue(null),
	signOut: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/utils/routes', () => ({ SITE_ROOT: 'https://example.com/' }));

describe('handleUnauthorized', () => {
	it('dispatches session-expired event and calls signOut', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { handleUnauthorized } = require('./helpers');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { signOut } = require('next-auth/react');

		const events: string[] = [];
		const listener = (e: Event) => events.push(e.type);
		window.addEventListener('session-expired', listener);

		await handleUnauthorized();

		window.removeEventListener('session-expired', listener);
		expect(events).toContain('session-expired');
		expect(signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: 'https://example.com/' });
	});

	it('calls the optional onResetToken callback', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { handleUnauthorized } = require('./helpers');
		const onReset = jest.fn();
		await handleUnauthorized(onReset);
		expect(onReset).toHaveBeenCalled();
	});
});

// ─── isAuthenticatedInstance ─────────────────────────────────────────────────

describe('isAuthenticatedInstance', () => {
	it('returns an axios instance', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { isAuthenticatedInstance } = require('./helpers');
		const instance = isAuthenticatedInstance();
		expect(typeof instance.request).toBe('function');
		expect(typeof instance.interceptors).toBe('object');
	});

	it('adds the session access token when redux token is not hydrated yet', async () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { isAuthenticatedInstance } = require('./helpers');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { getSession } = require('next-auth/react');
		getSession.mockResolvedValueOnce({ accessToken: 'session-token' });

		const instance = isAuthenticatedInstance(() => undefined);
		const response = await instance.get('/token-check', {
			adapter: async (config: InternalAxiosRequestConfig) => {
				const headers = config.headers as { get?: (key: string) => string | null; Authorization?: string };
				return {
					data: { authorization: headers.get?.('Authorization') ?? headers.Authorization },
					status: 200,
					statusText: 'OK',
					headers: {},
					config,
				};
			},
		});

		expect(getSession).toHaveBeenCalled();
		expect(response.data.authorization).toBe('Bearer session-token');
	});
});

// ─── allowAnyInstance ────────────────────────────────────────────────────────

describe('allowAnyInstance', () => {
	it('returns an axios instance', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { allowAnyInstance } = require('./helpers');
		const instance = allowAnyInstance();
		expect(typeof instance.request).toBe('function');
		expect(typeof instance.interceptors).toBe('object');
	});
});

describe('normalizeStatut', () => {
	it('strips diacritics from French status strings', async () => {
		const { normalizeStatut } = await import('./helpers');
		expect(normalizeStatut('Envoyé')).toBe('Envoye');
		expect(normalizeStatut('Signé')).toBe('Signe');
		expect(normalizeStatut('Terminé')).toBe('Termine');
		expect(normalizeStatut('Annulé')).toBe('Annule');
		expect(normalizeStatut('Expiré')).toBe('Expire');
	});

	it('leaves strings without diacritics unchanged', async () => {
		const { normalizeStatut } = await import('./helpers');
		expect(normalizeStatut('Brouillon')).toBe('Brouillon');
		expect(normalizeStatut('En cours')).toBe('En cours');
	});
});
