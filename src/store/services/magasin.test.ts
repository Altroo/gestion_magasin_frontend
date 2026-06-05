import { magasinApi } from '@/store/services/magasin';
import { setupApiStore } from '@/store/setupApiStore';

beforeAll(() => {
	process.env.NEXT_PUBLIC_ARTICLE_SEND_CSV_EXAMPLE_EMAIL ||= 'https://example.com/catalog/products/send-csv-example-email/';
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
});
