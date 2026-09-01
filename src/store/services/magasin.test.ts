import { magasinApi } from '@/store/services/magasin';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ARTICLE_SEND_CSV_EXAMPLE_EMAIL ||=
		'https://example.com/catalog/products/send-csv-example-email/';
	process.env.NEXT_PUBLIC_ATTENDANCE_ROOT ||= 'https://example.com/pointage/';
	process.env.NEXT_PUBLIC_SALES_PROMOTIONS ||= 'https://example.com/sales/promotions/';
	process.env.NEXT_PUBLIC_STORES_ROOT ||= 'https://example.com/stores/';
});

jest.mock('@/utils/axiosBaseQuery', () => {
	const baseQuery = jest.fn(async () => ({ data: { ok: true } }));
	return {
		axiosBaseQuery: () => baseQuery,
		mockMagasinBaseQuery: baseQuery,
	};
});

const { mockMagasinBaseQuery } = jest.requireMock('@/utils/axiosBaseQuery') as {
	mockMagasinBaseQuery: jest.Mock;
};

describe('magasinApi', () => {
	const storeRef = setupApiStore(magasinApi);

	beforeEach(() => {
		mockMagasinBaseQuery.mockClear();
	});

	it('sendCSVExampleEmail mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			magasinApi.endpoints.sendCSVExampleEmail.initiate({
				store: 1,
			}),
		);

		expect('error' in result).toBe(false);
	});

	it('sendAttendanceImportGuideEmail mutation should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			magasinApi.endpoints.sendAttendanceImportGuideEmail.initiate({
				store: 1,
			}),
		);

		expect('error' in result).toBe(false);
	});

	it('getPromotionEligibleStores query should complete without error', async () => {
		const result = await storeRef.store.dispatch(
			magasinApi.endpoints.getPromotionEligibleStores.initiate({
				product_ids: '1',
				quantities: '2',
			}),
		);

		expect('error' in result).toBe(false);
	});

	it('serializes store logo uploads and nested values as multipart data', async () => {
		const logo = new File(['logo'], 'store-logo.png', { type: 'image/png' });
		await storeRef.store.dispatch(
			magasinApi.endpoints.addStore.initiate({
				name: 'Store',
				code: 'STORE',
				address: '',
				phone: '',
				logo,
				remove_logo: false,
				is_active: true,
				managed_by: [{ pk: 1, role: 'direction' }],
				employees: [{ first_name: 'Aya', last_name: 'Test' }],
			}),
		);

		expect(mockMagasinBaseQuery).toHaveBeenCalled();
		const request = mockMagasinBaseQuery.mock.calls
			.map((call) => call[0] as { method?: string; data?: unknown })
			.find((call) => call.method === 'POST');
		expect(request).toBeDefined();
		expect(request?.data).toBeInstanceOf(FormData);
		const data = request?.data as FormData;
		expect(data.get('logo')).toBe(logo);
		expect(JSON.parse(String(data.get('managed_by')))).toEqual([{ pk: 1, role: 'direction' }]);
		expect(JSON.parse(String(data.get('employees')))).toEqual([{ first_name: 'Aya', last_name: 'Test' }]);
		expect(data.get('remove_logo')).toBe('false');
	});

	it('keeps remove-logo-only store updates as JSON', async () => {
		await storeRef.store.dispatch(
			magasinApi.endpoints.editStore.initiate({
				id: 1,
				data: {
					name: 'Store',
					code: 'STORE',
					address: '',
					phone: '',
					remove_logo: true,
					is_active: true,
					managed_by: [{ pk: 1, role: 'direction' }],
					employees: [],
				},
			}),
		);

		expect(mockMagasinBaseQuery).toHaveBeenCalled();
		const request = mockMagasinBaseQuery.mock.calls
			.map((call) => call[0] as { method?: string; data?: unknown })
			.find((call) => call.method === 'PUT');
		expect(request).toBeDefined();
		expect(request?.data).toEqual(expect.objectContaining({ remove_logo: true }));
		expect(request?.data).not.toBeInstanceOf(FormData);
	});
});
