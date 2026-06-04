import { createApi } from '@reduxjs/toolkit/query/react';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { PaginationResponseType } from '@/types/_initTypes';
import type {
	AttendancePayload,
	AttendanceRecordType,
	CategoryType,
	DashboardStatsType,
	EmployeeType,
	ProductPayload,
	ProductType,
	SaleCreatePayload,
	SaleType,
	StockBalanceType,
	StoreRoleType,
	StoreMembershipType,
	StorePayload,
	StoreType,
} from '@/types/gestionMagasinTypes';

type ListParams = {
	store?: number;
	search?: string;
	page?: number;
	pageSize?: number;
	[key: string]: string | number | boolean | undefined;
};

export const magasinApi = createApi({
	reducerPath: 'magasinApi',
	tagTypes: ['Stores', 'Products', 'Stock', 'Sales', 'Attendance'],
	baseQuery: axiosBaseQuery((api) =>
		isAuthenticatedInstance(
			() => getInitStateToken(api.getState() as RootState),
			() => api.dispatch(initToken()),
		),
	),
	endpoints: (builder) => ({
		getMyStores: builder.query<StoreMembershipType[], void>({
			query: () => ({ url: `${process.env.NEXT_PUBLIC_STORES_ROOT}mine/`, method: 'GET' }),
			providesTags: ['Stores'],
		}),
		getStores: builder.query<PaginationResponseType<StoreType>, { page?: number; pageSize?: number; search?: string; [key: string]: string | number | boolean | undefined } | void>({
			query: (params) => {
				const { page, pageSize, ...filters } = params ?? {};
				return {
					url: process.env.NEXT_PUBLIC_STORES_ROOT,
					method: 'GET',
					params: {
						page: page ?? 1,
						page_size: pageSize ?? 100,
						...filters,
					},
				};
			},
			providesTags: ['Stores'],
		}),
		getStore: builder.query<StoreType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STORES_ROOT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Stores'],
		}),
		addStore: builder.mutation<StoreType, StorePayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_STORES_ROOT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Stores'],
		}),
		editStore: builder.mutation<StoreType, { id: number; data: StorePayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_STORES_ROOT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Stores'],
		}),
		deleteStore: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STORES_ROOT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Stores'],
		}),
		bulkDeleteStores: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_STORES_ROOT}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Stores'],
		}),
		getStoreRoles: builder.query<PaginationResponseType<StoreRoleType>, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_STORES_ROOT}roles/`,
				method: 'GET',
				params: { page_size: 100 },
			}),
			providesTags: ['Stores'],
		}),
		getDashboardStats: builder.query<DashboardStatsType, { store?: number }>({
			query: ({ store }) => ({
				url: process.env.NEXT_PUBLIC_SALES_DASHBOARD,
				method: 'GET',
				params: { store },
			}),
			providesTags: ['Sales', 'Stock'],
		}),
		getCategories: builder.query<PaginationResponseType<CategoryType>, { search?: string; page?: number; pageSize?: number } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_CATALOG_CATEGORIES,
				method: 'GET',
				params: {
					search: params?.search,
					page: params?.page ?? 1,
					page_size: params?.pageSize ?? 100,
				},
			}),
			providesTags: ['Products'],
		}),
		getProducts: builder.query<PaginationResponseType<ProductType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_CATALOG_PRODUCTS,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Products', 'Stock'],
		}),
		getProduct: builder.query<ProductType, { id: number; store?: number }>({
			query: ({ id, store }) => ({
				url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}${id}/`,
				method: 'GET',
				params: { store },
			}),
			providesTags: ['Products', 'Stock'],
		}),
		addProduct: builder.mutation<ProductType, { store?: number; data: ProductPayload }>({
			query: ({ store, data }) => ({
				url: process.env.NEXT_PUBLIC_CATALOG_PRODUCTS,
				method: 'POST',
				params: { store },
				data,
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		editProduct: builder.mutation<ProductType, { id: number; store?: number; data: ProductPayload }>({
			query: ({ id, store, data }) => ({
				url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}${id}/`,
				method: 'PUT',
				params: { store },
				data,
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		deleteProduct: builder.mutation<void, { id: number; store?: number }>({
			query: ({ id, store }) => ({
				url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}${id}/`,
				method: 'DELETE',
				params: { store },
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		bulkDeleteProducts: builder.mutation<{ deleted: number }, { ids: number[]; store?: number }>({
			query: ({ ids, store }) => ({
				url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}bulk-delete/`,
				method: 'DELETE',
				params: { store },
				data: { ids },
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		scanProduct: builder.query<ProductType, { store: number; code: string }>({
			query: ({ store, code }) => ({
				url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}scan/`,
				method: 'GET',
				params: { store, code },
			}),
			providesTags: ['Products', 'Stock'],
		}),
		importProducts: builder.mutation<unknown, { store: number; file: File }>({
			query: ({ store, file }) => {
				const data = new FormData();
				data.append('store', String(store));
				data.append('file', file);
				return {
					url: `${process.env.NEXT_PUBLIC_CATALOG_PRODUCTS}import-workbook/`,
					method: 'POST',
					data,
				};
			},
			invalidatesTags: ['Products', 'Stock'],
		}),
		getStockBalances: builder.query<PaginationResponseType<StockBalanceType>, ListParams & { low?: boolean | string }>({
			query: ({ store, search, low, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_STOCK_BALANCES,
				method: 'GET',
				params: { store, search, low, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Stock'],
		}),
		getStockBalance: builder.query<StockBalanceType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_BALANCES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Stock'],
		}),
		adjustStock: builder.mutation<unknown, { store: number; product: number; quantity: string; movement_type?: string; note?: string }>({
			query: ({ store, ...data }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_BALANCES}adjust/`,
				method: 'POST',
				params: { store },
				data,
			}),
			invalidatesTags: ['Stock'],
		}),
		updateStockThreshold: builder.mutation<StockBalanceType, { id: number; min_stock: string }>({
			query: ({ id, min_stock }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_BALANCES}${id}/threshold/`,
				method: 'PATCH',
				data: { min_stock },
			}),
			invalidatesTags: ['Stock'],
		}),
		deleteStockBalance: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_BALANCES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Stock'],
		}),
		bulkDeleteStockBalances: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_BALANCES}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Stock'],
		}),
		createSale: builder.mutation<SaleType, SaleCreatePayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_SALES_ROOT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Sales', 'Stock'],
		}),
		syncOfflineSales: builder.mutation<{ results: SaleType[]; errors: unknown[] }, { store: number; sales: SaleCreatePayload[] }>({
			query: ({ store, sales }) => ({
				url: `${process.env.NEXT_PUBLIC_SALES_ROOT}sync-offline/`,
				method: 'POST',
				params: { store },
				data: { sales },
			}),
			invalidatesTags: ['Sales', 'Stock'],
		}),
		getSales: builder.query<PaginationResponseType<SaleType>, ListParams>({
			query: ({ store, page = 1, pageSize = 10, search, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_SALES_ROOT,
				method: 'GET',
				params: { store, page, page_size: pageSize, search, ...filters },
			}),
			providesTags: ['Sales'],
		}),
		getSale: builder.query<SaleType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_SALES_ROOT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Sales'],
		}),
		voidSale: builder.mutation<SaleType, { id: number; reason?: string }>({
			query: ({ id, reason = '' }) => ({
				url: `${process.env.NEXT_PUBLIC_SALES_ROOT}${id}/void/`,
				method: 'POST',
				data: { reason },
			}),
			invalidatesTags: ['Sales', 'Stock'],
		}),
		getEmployees: builder.query<PaginationResponseType<EmployeeType>, { store?: number; page?: number; pageSize?: number; search?: string }>({
			query: ({ store, page = 1, pageSize = 100, search }) => ({
				url: process.env.NEXT_PUBLIC_ATTENDANCE_EMPLOYEES,
				method: 'GET',
				params: { store, page, page_size: pageSize, search },
			}),
			providesTags: ['Attendance'],
		}),
		getAttendanceRecords: builder.query<PaginationResponseType<AttendanceRecordType>, ListParams>({
			query: ({ store, page = 1, pageSize = 10, search, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_ATTENDANCE_ROOT,
				method: 'GET',
				params: { store, page, page_size: pageSize, search, ...filters },
			}),
			providesTags: ['Attendance'],
		}),
		getAttendanceRecord: builder.query<AttendanceRecordType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ATTENDANCE_ROOT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Attendance'],
		}),
		addAttendanceRecord: builder.mutation<AttendanceRecordType, AttendancePayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_ATTENDANCE_ROOT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Attendance'],
		}),
		editAttendanceRecord: builder.mutation<AttendanceRecordType, { id: number; data: AttendancePayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ATTENDANCE_ROOT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Attendance'],
		}),
		deleteAttendanceRecord: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ATTENDANCE_ROOT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Attendance'],
		}),
		importAttendance: builder.mutation<unknown, { store: number; file: File }>({
			query: ({ store, file }) => {
				const data = new FormData();
				data.append('store', String(store));
				data.append('file', file);
				return {
					url: `${process.env.NEXT_PUBLIC_ATTENDANCE_ROOT}import-workbook/`,
					method: 'POST',
					data,
				};
			},
			invalidatesTags: ['Attendance'],
		}),
	}),
});

export const {
	useAddAttendanceRecordMutation,
	useAddStoreMutation,
	useAddProductMutation,
	useAdjustStockMutation,
	useBulkDeleteProductsMutation,
	useBulkDeleteStoresMutation,
	useBulkDeleteStockBalancesMutation,
	useCreateSaleMutation,
	useDeleteAttendanceRecordMutation,
	useDeleteProductMutation,
	useDeleteStoreMutation,
	useDeleteStockBalanceMutation,
	useEditAttendanceRecordMutation,
	useEditProductMutation,
	useEditStoreMutation,
	useGetAttendanceRecordQuery,
	useGetAttendanceRecordsQuery,
	useGetCategoriesQuery,
	useGetDashboardStatsQuery,
	useGetEmployeesQuery,
	useGetMyStoresQuery,
	useGetProductQuery,
	useGetProductsQuery,
	useGetSaleQuery,
	useGetSalesQuery,
	useGetStoreQuery,
	useGetStoreRolesQuery,
	useGetStoresQuery,
	useGetStockBalanceQuery,
	useGetStockBalancesQuery,
	useImportAttendanceMutation,
	useImportProductsMutation,
	useLazyScanProductQuery,
	useSyncOfflineSalesMutation,
	useUpdateStockThresholdMutation,
	useVoidSaleMutation,
} = magasinApi;
