import axios, { AxiosError, type AxiosInstance } from 'axios';
import { fetchPdfBlob, getPendingPdfRequests, subscribePdfRequests } from './apiHelpers';
import { PdfTranslationDeferredError } from './pdfErrors';
jest.mock('axios', () => {
	const actual = jest.requireActual('axios');
	return { ...actual, __esModule: true, default: { ...actual.default, create: jest.fn() } };
});
const mockedAxios = axios as jest.Mocked<typeof axios>;
describe('PDF preparation and loading', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it('keeps loading active until every concurrent request completes', async () => {
		let finishFirst!: (value: { data: Blob }) => void;
		let finishSecond!: (value: { data: Blob }) => void;
		const get = jest
			.fn()
			.mockReturnValueOnce(
				new Promise((resolve) => {
					finishFirst = resolve;
				}),
			)
			.mockReturnValueOnce(
				new Promise((resolve) => {
					finishSecond = resolve;
				}),
			);
		mockedAxios.create.mockReturnValue({ get } as unknown as AxiosInstance);
		const counts: number[] = [];
		const unsubscribe = subscribePdfRequests(() => counts.push(getPendingPdfRequests()));
		const first = fetchPdfBlob('/one', 'token');
		const second = fetchPdfBlob('/two', 'token');
		expect(getPendingPdfRequests()).toBe(2);
		finishFirst({ data: new Blob(['%PDF']) });
		await first;
		expect(getPendingPdfRequests()).toBe(1);
		finishSecond({ data: new Blob(['%PDF']) });
		await second;
		expect(counts).toEqual([1, 2, 1, 0]);
		unsubscribe();
	});

	it('waits for background preparation and keeps loading visible between polls', async () => {
		jest.useFakeTimers();
		const waiting = new AxiosError('preparing');
		waiting.response = {
			status: 409,
			data: { details: { code: 'pdf_translation_pending' } },
		} as AxiosError['response'];
		const blob = new Blob(['%PDF']);
		const get = jest.fn().mockRejectedValueOnce(waiting).mockResolvedValueOnce({ data: blob });
		mockedAxios.create.mockReturnValue({ get } as unknown as AxiosInstance);
		const request = fetchPdfBlob('/one', 'token');
		expect(getPendingPdfRequests()).toBe(1);
		await jest.advanceTimersByTimeAsync(2_000);
		await expect(request).resolves.toBe(blob);
		expect(get).toHaveBeenCalledTimes(2);
		expect(getPendingPdfRequests()).toBe(0);
	});

	it('stops polling a deferred quota and clears the spinner immediately', async () => {
		const waiting = new AxiosError('queued');
		waiting.response = {
			status: 409,
			data: { details: { code: 'pdf_translation_deferred' } },
		} as AxiosError['response'];
		const get = jest.fn().mockRejectedValue(waiting);
		mockedAxios.create.mockReturnValue({ get } as unknown as AxiosInstance);
		await expect(fetchPdfBlob('/one', 'token')).rejects.toBeInstanceOf(PdfTranslationDeferredError);
		expect(get).toHaveBeenCalledTimes(1);
		expect(getPendingPdfRequests()).toBe(0);
	});

	it.each([401, 403, 409, 503])('does not retry unrelated HTTP %i errors and clears loading', async (status) => {
		const failure = new AxiosError('failed');
		failure.response = { status, data: { details: { code: 'other_error' } } } as AxiosError['response'];
		const get = jest.fn().mockRejectedValue(failure);
		mockedAxios.create.mockReturnValue({ get } as unknown as AxiosInstance);
		await expect(fetchPdfBlob('/one', 'token')).rejects.toBe(failure);
		expect(get).toHaveBeenCalledTimes(1);
		expect(getPendingPdfRequests()).toBe(0);
	});

	it('bounds pending retries and clears loading on timeout', async () => {
		jest.useFakeTimers();
		const waiting = new AxiosError('preparing');
		waiting.response = { status: 409, data: { code: 'pdf_translation_pending' } } as AxiosError['response'];
		mockedAxios.create.mockReturnValue({ get: jest.fn().mockRejectedValue(waiting) } as unknown as AxiosInstance);
		const request = expect(fetchPdfBlob('/one', 'token')).rejects.toBeInstanceOf(PdfTranslationDeferredError);
		await jest.advanceTimersByTimeAsync(180_000);
		await request;
		expect(getPendingPdfRequests()).toBe(0);
	});
});
