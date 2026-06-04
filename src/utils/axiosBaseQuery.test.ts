import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { axiosBaseQuery, ApiErrorResponseType } from './axiosBaseQuery';

function makeBaseQueryApi(state: unknown): BaseQueryApi {
	const api: Partial<BaseQueryApi> = {
		getState: () => state,
		dispatch: (() => void 0) as BaseQueryApi['dispatch'],
		extra: undefined,
		endpoint: '',
		type: 'query',
		signal: new AbortController().signal,
	};
	return api as BaseQueryApi;
}

describe('axiosBaseQuery', () => {
	let instance: AxiosInstance;

	beforeEach(() => {
		instance = axios.create();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('returns data on success', async () => {
		const responseData = { ok: true };
		const spy = jest.spyOn(instance, 'request').mockResolvedValueOnce({ data: responseData });

		const getInstance = () => instance;
		const baseQuery = axiosBaseQuery(getInstance);

		const result = await baseQuery({ url: '/x', method: 'GET' }, makeBaseQueryApi({}), {});
		expect(result).toEqual({ data: responseData });
		expect(spy).toHaveBeenCalledWith({ url: '/x', method: 'GET', data: undefined, params: undefined });
	});

	it('handles normalized errors thrown by interceptors', async () => {
		const normalized = {
			error: {
				status_code: 401,
				message: 'Token expired',
				details: { token: ['expired'] },
			},
		};

		jest.spyOn(instance, 'request').mockRejectedValueOnce(normalized);

		const getInstance = () => instance;
		const baseQuery = axiosBaseQuery(getInstance);

		const result = await baseQuery({ url: '/x', method: 'GET' }, makeBaseQueryApi({}), {});
		expect(result).toEqual({ error: { status: 401, data: normalized.error } });
	});

	it('handles axios errors with response', async () => {
		const serverError: ApiErrorResponseType = {
			status_code: 500,
			message: 'Server failure',
			details: { backend: ['boom'] },
		};

		const axiosErr = {
			isAxiosError: true,
			message: 'Request failed',
			response: { status: 500, data: serverError },
			config: {},
		} as Partial<AxiosError<ApiErrorResponseType>>;

		jest.spyOn(instance, 'request').mockRejectedValueOnce(axiosErr);

		const getInstance = () => instance;
		const baseQuery = axiosBaseQuery(getInstance);

		const result = await baseQuery({ url: '/x', method: 'GET' }, makeBaseQueryApi({}), {});
		expect(result).toEqual({ error: { status: 500, data: serverError } });
	});

	it('handles unknown errors', async () => {
		const unknownErr = new Error('unexpected');

		jest.spyOn(instance, 'request').mockRejectedValueOnce(unknownErr);

		const getInstance = () => instance;
		const baseQuery = axiosBaseQuery(getInstance);

		const result = await baseQuery({ url: '/x', method: 'GET' }, makeBaseQueryApi({}), {});
		expect(result).toEqual({
			error: {
				status: 0,
				data: {
					status_code: 0,
					message: 'unexpected',
					details: { error: ["Une erreur inattendue s'est produite."] },
				},
			},
		});
	});
});
