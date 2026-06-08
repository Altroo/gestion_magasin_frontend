import { magasinApi } from '@/store/services/magasin';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ARTICLE_SEND_CSV_EXAMPLE_EMAIL ||= 'https://example.com/catalog/products/send-csv-example-email/';
	process.env.NEXT_PUBLIC_ATTENDANCE_ROOT ||= 'https://example.com/pointage/';
	process.env.NEXT_PUBLIC_SALES_PROMOTIONS ||= 'https://example.com/sales/promotions/';
});

jest.mock('@/utils/axiosBaseQuery', () => ({
	axiosBaseQuery: () => async () => ({ data: { ok: true } }),
}));

describe('magasinApi', () => {
	const storeRef = setupApiStore(magasinApi);

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
});
