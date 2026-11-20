import { PdfTranslationDeferredError } from './pdfErrors';
import axios, { type AxiosInstance } from 'axios';

// POST Next api/cookies
export const cookiesPoster = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.post(
		url,
		{ ...body, maxAge: 86400 },
		{ headers: { 'Content-Type': 'application/json' } },
	);
	return { status: response.status };
};

// DELETE Next api/cookies
export const cookiesDeleter = async (url: string, body: object) => {
	const instance = axios.create();
	const response = await instance.delete(url, { data: body });
	return { status: response.status };
};

/*** Fetch a PDF or DOCX blob via GET with Bearer auth token */
export const fetchFileBlob = async (url: string, accessToken: string): Promise<Blob> => {
	const instance = axios.create();
	const response = await instance.get<Blob>(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
		responseType: 'blob',
	});
	return response.data;
};

let pendingPdfRequests = 0;
const pdfRequestListeners = new Set<() => void>();

export const subscribePdfRequests = (listener: () => void) => {
	pdfRequestListeners.add(listener);
	return () => {
		pdfRequestListeners.delete(listener);
	};
};
export const getPendingPdfRequests = () => pendingPdfRequests;
export const getServerPendingPdfRequests = () => 0;

const notifyPdfRequests = (change: number) => {
	pendingPdfRequests += change;
	for (const listener of pdfRequestListeners) listener();
};

const pdfTranslationState = async (error: unknown): Promise<string | undefined> => {
	if (!axios.isAxiosError(error) || error.response?.status !== 409) return undefined;
	try {
		const data: unknown = error.response.data;
		const payload: unknown = data instanceof Blob ? JSON.parse(await data.text()) : data;
		if (!payload || typeof payload !== 'object') return undefined;
		const details = 'details' in payload ? payload.details : payload;
		return details && typeof details === 'object' && 'code' in details && typeof details.code === 'string'
			? details.code
			: undefined;
	} catch {
		return undefined;
	}
};

/** Fetch a PDF, keeping loading feedback active while new background text is prepared. */
export const fetchPdfBlob = async (url: string, accessToken: string): Promise<Blob> => {
	notifyPdfRequests(1);
	try {
		const instance = axios.create();
		const deadline = Date.now() + 45_000;
		for (;;) {
			try {
				const response = await instance.get<Blob>(url, {
					headers: { Authorization: `Bearer ${accessToken}` },
					responseType: 'blob',
					timeout: Math.min(30_000, Math.max(1, deadline - Date.now())),
				});
				return response.data;
			} catch (error) {
				const state = await pdfTranslationState(error);
				if (
					state === 'pdf_translation_deferred' ||
					(state === 'pdf_translation_pending' && Date.now() + 2_000 >= deadline)
				)
					throw new PdfTranslationDeferredError();
				if (state !== 'pdf_translation_pending') throw error;
				await new Promise<void>((resolve) => setTimeout(resolve, 2_000));
			}
		}
	} finally {
		notifyPdfRequests(-1);
	}
};

/*** Base Axios JSON API call [POST] */
export const postApi = async (url: string | undefined, instance: AxiosInstance, body?: object) => {
	const response = await instance.post(`${url}`, body);
	return {
		status: response.status,
		data: response.data,
	};
};

/*** Base Axios JSON API call [GET] */
export const getApi = async (url: string | undefined, instance: AxiosInstance, queryParams?: object) => {
	const response = await instance.get(`${url}`, { params: queryParams });
	return {
		status: response.status,
		data: response.data,
	};
};
