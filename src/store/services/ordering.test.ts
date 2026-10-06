import { usersApi } from './account';
import { magasinApi } from './magasin';
import { setupApiStore } from '@/store/setupApiStore';

jest.mock('@/utils/axiosBaseQuery', () => {
	const baseQuery = jest.fn(async () => ({ data: { count: 0, results: [] } }));
	return { axiosBaseQuery: () => baseQuery, mockOrderingBaseQuery: baseQuery };
});
const { mockOrderingBaseQuery } = jest.requireMock('@/utils/axiosBaseQuery') as { mockOrderingBaseQuery: jest.Mock };

describe('getUsersList ordering', () => {
	const storeRef = setupApiStore(usersApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(usersApi.endpoints.getUsersList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStores ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getStores.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getProducts ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getProducts.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getPurchases ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getPurchases.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getInventorySessions ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getInventorySessions.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockTransfers ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getStockTransfers.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockBalances ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getStockBalances.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getStockAddRequests ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getStockAddRequests.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getPromotions ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getPromotions.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getSales ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getSales.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getExpenses ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getExpenses.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getAttendanceRecords ordering', () => {
	const storeRef = setupApiStore(magasinApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			with_pagination: true,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(magasinApi.endpoints.getAttendanceRecords.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});
