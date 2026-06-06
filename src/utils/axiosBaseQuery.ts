import axios, { type AxiosInstance } from 'axios';
import type { BaseQueryFn, BaseQueryApi } from '@reduxjs/toolkit/query';
import { getT } from '@/utils/helpers';

// Backend error response structure
export type ApiErrorResponseType = {
	status_code: number;
	message: string;
	details?: Record<string, string[] | string>;
};

// Normalized error structure used internally
type NormalizedError = {
	error: ApiErrorResponseType;
};

const normalizeErrorData = (status: number, data: unknown): ApiErrorResponseType | null => {
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

// Type guard for normalized errors
const isNormalizedError = (err: unknown): err is NormalizedError => {
	return (
		typeof err === 'object' &&
		err !== null &&
		'error' in err &&
		typeof (err as { error: unknown }).error === 'object' &&
		'status_code' in (err as NormalizedError).error
	);
};

type AxiosBaseQueryArgs<D = unknown, P = unknown> = {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data?: D;
	params?: P;
};

/**
 * A reusable Axios baseQuery for RTK Query that allows access to Redux state
 * via the BaseQueryApi parameter.
 */
export const axiosBaseQuery =
	<D = unknown, P = unknown>(
		getInstance: (api: BaseQueryApi) => AxiosInstance,
	): BaseQueryFn<AxiosBaseQueryArgs<D, P>, unknown, { status: number; data: ApiErrorResponseType }> =>
	async ({ url, method, data, params }, api) => {
		const instance = getInstance(api);

		try {
			const response = await instance.request({ url, method, data, params });
			return { data: response.data };
		} catch (err) {
			// Handle normalized errors from interceptors
			if (isNormalizedError(err)) {
				return {
					error: {
						status: err.error.status_code,
						data: err.error,
					},
				};
			}

			// Handle raw Axios errors
			if (axios.isAxiosError(err)) {
				const status = err.response?.status ?? 0;
				const errorData: ApiErrorResponseType = normalizeErrorData(status, err.response?.data) ?? {
					status_code: status || 0,
					message: err.message || getT().errors.networkError,
					details: { error: [getT().errors.cannotConnectServer] },
				};

				return {
					error: {
						status: status || 0,
						data: errorData,
					},
				};
			}

			// Handle unexpected errors
			return {
				error: {
					status: 0,
					data: {
						status_code: 0,
						message: err instanceof Error ? err.message : getT().errors.unknownError,
						details: { error: [getT().errors.unexpectedError] },
					},
				},
			};
		}
	};
