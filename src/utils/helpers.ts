import axios, { AxiosHeaders } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { SITE_ROOT } from '@/utils/routes';
import type { APIContentTypeInterface, ApiErrorResponseType, InitStateToken } from '@/types/_initTypes';
import type { Language } from '@/types/languageTypes';
import { translations } from '@/translations';

/** Module-level language for non-React utility code */
let currentLang: Language = 'fr';
export const getT = () => translations[currentLang];

/** Call this from LanguageContextProvider to keep helpers in sync */
export const setHelpersLanguage = (lang: Language) => {
	currentLang = lang;
};

const normalizeBackendError = (status: number, data: unknown): ApiErrorResponseType | null => {
	if (!data || typeof data !== 'object') {
		return null;
	}
	const errorData = data as Partial<ApiErrorResponseType> & { detail?: unknown };
	if (errorData.status_code !== undefined && errorData.message !== undefined) {
		return {
			status_code: errorData.status_code,
			message: errorData.message,
			details: errorData.details || {},
		};
	}
	if (typeof errorData.detail === 'string') {
		return {
			status_code: status,
			message: errorData.detail,
			details: { detail: [errorData.detail] },
		};
	}
	return null;
};

/**
 * Handles unauthorized response by clearing cookies, signing out, and resetting token.
 * Dispatches a custom 'session-expired' event to notify the UI.
 */
export const handleUnauthorized = async (onResetToken?: () => void) => {
	// Notify UI about session expiration
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('session-expired'));
	}
	await signOut({ redirect: false, redirectTo: SITE_ROOT });
	if (onResetToken) {
		onResetToken();
	}
};

/**
 * Creates an Axios instance with authentication headers.
 * The getToken callback should read the latest token from Redux state (via api.getState()).
 */
export const isAuthenticatedInstance = (
	getToken?: () => InitStateToken | undefined,
	onUnauthorized?: () => void,
	contentType: APIContentTypeInterface = 'application/json',
): AxiosInstance => {
	const instance = axios.create({
		baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
		headers: {
			'Content-Type': contentType,
		},
	});

	// Request interceptor - add auth token
	instance.interceptors.request.use(
		async (config: InternalAxiosRequestConfig) => {
			const headers = new AxiosHeaders(config.headers as Record<string, string>);
			const token = getToken?.();
			if (token?.access) {
				headers.set('Authorization', `Bearer ${token.access}`);
			} else {
				const freshSession = await getSession();
				if (freshSession?.accessToken) {
					headers.set('Authorization', `Bearer ${freshSession.accessToken}`);
				}
			}
			// Send current language to backend for i18n
			headers.set('Accept-Language', currentLang);

			// Let axios auto-set Content-Type (with boundary) for multipart uploads
			if (config.data instanceof FormData) {
				headers.delete('Content-Type');
			}
			config.headers = headers as InternalAxiosRequestConfig['headers'];
			return config;
		},
		(error) => Promise.reject(error),
	);

	// Response interceptor - handle errors
	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		async (error) => {
			if (error.response?.data) {
				const errorData = normalizeBackendError(error.response.status, error.response.data);

				if (error.response.status >= 500) {
					return Promise.reject({
						error: {
							status_code: error.response.status,
							message: getT().errors.serverError,
							details: {
								error: [
									getT().errors.networkCheckMessage,
								],
							},
						},
					});
				}
				if (error.response.status === 401) {
					// Retry once with a fresh session token before giving up
					if (error.config && !error.config._retried) {
						error.config._retried = true;
						const freshSession = await getSession();
						if (freshSession?.accessToken) {
							error.config.headers['Authorization'] = `Bearer ${freshSession.accessToken}`;
							return instance(error.config);
						}
					}
					await handleUnauthorized(onUnauthorized);
					return Promise.reject({
						error: {
							status_code: 401,
							message: errorData?.message || getT().errors.unauthorized,
							details: errorData?.details || { error: [getT().errors.authRequiredDetail] },
						},
					});
				}
				if (errorData) {
					return Promise.reject({
						error: {
							status_code: errorData.status_code,
							message: errorData.message,
							details: errorData.details || {},
						},
					});
				}
			}
			return Promise.reject({
				error: {
					status_code: 0,
					message: error.message || getT().errors.networkError,
					details: { error: [getT().errors.cannotConnectServer] },
				},
			});
		},
	);

	return instance;
};

/**
 * Creates an Axios instance without authentication.
 */
export const allowAnyInstance = (contentType: APIContentTypeInterface = 'application/json'): AxiosInstance => {
	const instance = axios.create({
		baseURL: process.env.NEXT_PUBLIC_ROOT_API_URL,
		headers: {
			'Content-Type': contentType,
		},
	});

	instance.interceptors.response.use(
		(response: AxiosResponse) => response,
		(error) => {
			if (error.response?.data) {
				const errorData = normalizeBackendError(error.response.status, error.response.data);
				if (errorData) {
					return Promise.reject({
						error: {
							status_code: errorData.status_code,
							message: errorData.message,
							details: errorData.details || {},
						},
					});
				}
			}
			return Promise.reject({
				error: {
					status_code: error.response?.status || 0,
					message: error.message || getT().errors.networkError,
					details: { error: [getT().errors.cannotConnectServer] },
				},
			});
		},
	);

	return instance;
};

type FormikAutoErrorsProps = {
	e: unknown;
	setFieldError: (field: string, message: string | undefined) => void;
};

/**
 * Automatically maps API error responses to Formik field errors.
 */
export const setFormikAutoErrors = ({ e, setFieldError }: FormikAutoErrorsProps) => {
	const payload =
		(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).error ??
		(e as { error?: ApiErrorResponseType; data?: ApiErrorResponseType }).data ??
		(e as ApiErrorResponseType);

	if (!payload?.details) return;

	for (const [field, messages] of Object.entries(payload.details)) {
		const errorMsg = Array.isArray(messages) ? messages[0] : messages;
		if (field === 'error' || field === 'detail') {
			setFieldError('globalError', errorMsg);
		} else {
			if (Array.isArray(messages)) {
				messages.forEach((msg) => setFieldError(field, msg));
			} else {
				setFieldError(field, messages);
			}
		}
	}
};

/**
 * Converts hex color to RGB or RGBA string.
 */
export const hexToRGB = (hex: string, alpha?: number): string => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return alpha !== undefined ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};

export const formatDate = (value: string | null, locale: 'fr' | 'en' = 'fr') => {
	if (!value) return '—'; // display a placeholder for null
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(date);
};

export const formatLocalDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const formatDateShort = (value: string | null, locale: 'fr' | 'en' = 'fr'): string => {
	if (!value) return '—';
	// Parse YYYY-MM-DD as local date to avoid timezone shift
	const parts = value.split('-');
	if (parts.length !== 3) return '—';
	const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
	}).format(date);
};

export const formatNumber = (value: string | number | null | undefined, locale: 'fr' | 'en' = 'fr'): string => {
	if (value === null || value === undefined) return '0,00';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (Number.isNaN(num)) return '0,00';
	return num.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseNumber = (value: string | number): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === '') return null;
	// Replace comma with dot for decimal parsing (supports both "10.5" and "10,5")
	const normalized = trimmed.replace(',', '.');
	// Return null for intermediate typing states (trailing decimal point)
	// This keeps the raw string in the input so user can continue typing decimals
	if (normalized.endsWith('.')) return null;
	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
};

export const getLabelForKey = (fieldLabels: Record<string, string>, key: string): string =>
	fieldLabels[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

export const normalizeStatut = (s: string): string =>
	s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Extracts a user-friendly error message from an RTK Query mutation error.
 * When the backend returns structured error details (e.g. ProtectedError / 409),
 * the first detail string is returned. Otherwise returns the fallback message.
 */
export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === 'object' &&
		error !== null &&
		'data' in error &&
		typeof (error as { data: unknown }).data === 'object' &&
		(error as { data: { details?: Record<string, string[] | string> } }).data !== null
	) {
		const data = (error as { data: { message?: string; details?: Record<string, string[] | string> } }).data;
		const details = data.details;
		if (details) {
			for (const values of Object.values(details)) {
				if (Array.isArray(values) && values.length > 0) {
					return values[0];
				}
				if (typeof values === 'string' && values.length > 0) {
					return values;
				}
			}
		}
		if (data.message) {
			return data.message;
		}
	}
	return fallback;
};
