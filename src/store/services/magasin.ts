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
	DashboardReportType,
	EmployeeType,
	ExpenseCategoryType,
	ExpensePayload,
	ExpenseType,
	ActivityHistoryType,
	InventoryPayload,
	InventorySessionType,
	PaymentModeType,
	ProductPayload,
	ProductType,
	ProductUnitType,
	PromotionPayload,
	PromotionType,
	PurchasePayload,
	PurchaseType,
	SaleCreatePayload,
	SaleType,
	StockBalanceType,
	StockTransferPayload,
	StockTransferType,
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
	tagTypes: ['Stores', 'Products', 'Stock', 'Sales', 'Attendance', 'Expenses', 'Purchases', 'Inventory', 'Transfers', 'Promotions', 'PaymentModes', 'Reports'],
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
		getDashboardReport: builder.query<DashboardReportType, { store?: number; date_from?: string; date_to?: string }>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_REPORTS_DASHBOARD,
				method: 'GET',
				params,
			}),
			providesTags: ['Reports', 'Sales', 'Stock', 'Expenses', 'Purchases', 'Inventory'],
		}),
		getActivityHistory: builder.query<{ results: ActivityHistoryType[] }, { page?: number } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_REPORTS_ACTIVITY,
				method: 'GET',
				params,
			}),
			providesTags: ['Reports'],
		}),
		getCategories: builder.query<PaginationResponseType<CategoryType>, { search?: string; page?: number; pageSize?: number } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_CATEGORIES,
				method: 'GET',
				params: {
					search: params?.search,
					page: params?.page ?? 1,
					page_size: params?.pageSize ?? 100,
				},
			}),
			providesTags: ['Products'],
		}),
		addCategory: builder.mutation<CategoryType, { code: string; name: string; is_active?: boolean }>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_CATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Products'],
		}),
		editCategory: builder.mutation<CategoryType, { id: number; data: Partial<{ code: string; name: string; is_active: boolean }> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_CATEGORIES}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Products'],
		}),
		deleteCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_CATEGORIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Products'],
		}),
		getProductUnits: builder.query<PaginationResponseType<ProductUnitType>, { search?: string; page?: number; pageSize?: number } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_UNITS,
				method: 'GET',
				params: {
					search: params?.search,
					page: params?.page ?? 1,
					page_size: params?.pageSize ?? 100,
				},
			}),
			providesTags: ['Products'],
		}),
		addProductUnit: builder.mutation<ProductUnitType, { code: string; name: string; is_active?: boolean }>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_UNITS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Products'],
		}),
		editProductUnit: builder.mutation<ProductUnitType, { id: number; data: Partial<{ code: string; name: string; is_active: boolean }> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_UNITS}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Products'],
		}),
		deleteProductUnit: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_UNITS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Products'],
		}),
		getProducts: builder.query<PaginationResponseType<ProductType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Products', 'Stock'],
		}),
		getProduct: builder.query<ProductType, { id: number; store?: number }>({
			query: ({ id, store }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}${id}/`,
				method: 'GET',
				params: { store },
			}),
			providesTags: ['Products', 'Stock'],
		}),
		addProduct: builder.mutation<ProductType, { store?: number; data: ProductPayload }>({
			query: ({ store, data }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS,
				method: 'POST',
				params: { store },
				data,
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		editProduct: builder.mutation<ProductType, { id: number; store?: number; data: ProductPayload }>({
			query: ({ id, store, data }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}${id}/`,
				method: 'PUT',
				params: { store },
				data,
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		deleteProduct: builder.mutation<void, { id: number; store?: number }>({
			query: ({ id, store }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}${id}/`,
				method: 'DELETE',
				params: { store },
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		bulkDeleteProducts: builder.mutation<{ deleted: number }, { ids: number[]; store?: number }>({
			query: ({ ids, store }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}bulk-delete/`,
				method: 'DELETE',
				params: { store },
				data: { ids },
			}),
			invalidatesTags: ['Products', 'Stock'],
		}),
		scanProduct: builder.query<ProductType, { store: number; code: string }>({
			query: ({ store, code }) => ({
				url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}scan/`,
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
					url: `${process.env.NEXT_PUBLIC_ARTICLE_PRODUCTS}import-workbook/`,
					method: 'POST',
					data,
				};
			},
			invalidatesTags: ['Products', 'Stock'],
		}),
		sendCSVExampleEmail: builder.mutation<{ message: string }, { store: number }>({
			query: ({ store }) => ({
				url: process.env.NEXT_PUBLIC_ARTICLE_SEND_CSV_EXAMPLE_EMAIL,
				method: 'POST',
				data: { store },
			}),
		}),
		getPurchases: builder.query<PaginationResponseType<PurchaseType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_STOCK_PURCHASES,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Purchases', 'Stock'],
		}),
		getPurchase: builder.query<PurchaseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_PURCHASES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Purchases', 'Stock'],
		}),
		addPurchase: builder.mutation<PurchaseType, PurchasePayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_STOCK_PURCHASES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Purchases', 'Stock', 'Reports'],
		}),
		editPurchase: builder.mutation<PurchaseType, { id: number; data: PurchasePayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_PURCHASES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Purchases', 'Stock', 'Reports'],
		}),
		deletePurchase: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_PURCHASES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Purchases', 'Stock', 'Reports'],
		}),
		bulkDeletePurchases: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_PURCHASES}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Purchases', 'Stock', 'Reports'],
		}),
		receivePurchase: builder.mutation<PurchaseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_PURCHASES}${id}/receive/`,
				method: 'POST',
			}),
			invalidatesTags: ['Purchases', 'Stock', 'Reports'],
		}),
		getInventorySessions: builder.query<PaginationResponseType<InventorySessionType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_STOCK_INVENTORY,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Inventory', 'Stock'],
		}),
		getInventorySession: builder.query<InventorySessionType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_INVENTORY}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Inventory', 'Stock'],
		}),
		addInventorySession: builder.mutation<InventorySessionType, InventoryPayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_STOCK_INVENTORY,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Inventory', 'Stock', 'Reports'],
		}),
		editInventorySession: builder.mutation<InventorySessionType, { id: number; data: InventoryPayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_INVENTORY}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Inventory', 'Stock', 'Reports'],
		}),
		deleteInventorySession: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_INVENTORY}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Inventory', 'Stock', 'Reports'],
		}),
		bulkDeleteInventorySessions: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_INVENTORY}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Inventory', 'Stock', 'Reports'],
		}),
		validateInventorySession: builder.mutation<InventorySessionType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_INVENTORY}${id}/validate/`,
				method: 'POST',
			}),
			invalidatesTags: ['Inventory', 'Stock', 'Reports'],
		}),
		getStockTransfers: builder.query<PaginationResponseType<StockTransferType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_STOCK_TRANSFERS,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Transfers', 'Stock'],
		}),
		getStockTransfer: builder.query<StockTransferType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_TRANSFERS}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Transfers', 'Stock'],
		}),
		addStockTransfer: builder.mutation<StockTransferType, StockTransferPayload>({
			query: ({ store, ...data }) => ({
				url: process.env.NEXT_PUBLIC_STOCK_TRANSFERS,
				method: 'POST',
				params: { store },
				data,
			}),
			invalidatesTags: ['Transfers', 'Stock', 'Reports'],
		}),
		editStockTransfer: builder.mutation<StockTransferType, { id: number; data: StockTransferPayload }>({
			query: ({ id, data }) => {
				const { store, ...payload } = data;
				return {
					url: `${process.env.NEXT_PUBLIC_STOCK_TRANSFERS}${id}/`,
					method: 'PUT',
					params: { store },
					data: payload,
				};
			},
			invalidatesTags: ['Transfers', 'Stock', 'Reports'],
		}),
		deleteStockTransfer: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_TRANSFERS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Transfers', 'Stock', 'Reports'],
		}),
		bulkDeleteStockTransfers: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_TRANSFERS}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Transfers', 'Stock', 'Reports'],
		}),
		validateStockTransfer: builder.mutation<StockTransferType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_STOCK_TRANSFERS}${id}/validate/`,
				method: 'POST',
			}),
			invalidatesTags: ['Transfers', 'Stock', 'Reports'],
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
		getPromotions: builder.query<PaginationResponseType<PromotionType>, ListParams>({
			query: ({ store, page = 1, pageSize = 10, search, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_SALES_PROMOTIONS,
				method: 'GET',
				params: { store, page, page_size: pageSize, search, ...filters },
			}),
			providesTags: ['Promotions'],
		}),
		getPromotion: builder.query<PromotionType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_SALES_PROMOTIONS}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Promotions'],
		}),
		addPromotion: builder.mutation<PromotionType, PromotionPayload>({
			query: ({ store, ...data }) => ({
				url: process.env.NEXT_PUBLIC_SALES_PROMOTIONS,
				method: 'POST',
				params: { store },
				data,
			}),
			invalidatesTags: ['Promotions', 'Reports'],
		}),
		editPromotion: builder.mutation<PromotionType, { id: number; data: PromotionPayload }>({
			query: ({ id, data }) => {
				const { store, ...payload } = data;
				return {
					url: `${process.env.NEXT_PUBLIC_SALES_PROMOTIONS}${id}/`,
					method: 'PUT',
					params: { store },
					data: payload,
				};
			},
			invalidatesTags: ['Promotions', 'Reports'],
		}),
		deletePromotion: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_SALES_PROMOTIONS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Promotions', 'Reports'],
		}),
		getPaymentModes: builder.query<PaginationResponseType<PaymentModeType>, { page?: number; pageSize?: number; search?: string; is_active?: string | boolean } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_SALES_PAYMENT_MODES,
				method: 'GET',
				params: {
					search: params?.search,
					is_active: params?.is_active,
					page: params?.page ?? 1,
					page_size: params?.pageSize ?? 100,
				},
			}),
			providesTags: ['PaymentModes'],
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
		getExpenseCategories: builder.query<PaginationResponseType<ExpenseCategoryType>, { page?: number; pageSize?: number; search?: string } | void>({
			query: (params) => ({
				url: process.env.NEXT_PUBLIC_FINANCE_CATEGORIES,
				method: 'GET',
				params: { page: params?.page ?? 1, page_size: params?.pageSize ?? 100, search: params?.search },
			}),
			providesTags: ['Expenses'],
		}),
		addExpenseCategory: builder.mutation<ExpenseCategoryType, { code: string; name: string; is_active?: boolean }>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_FINANCE_CATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Expenses'],
		}),
		editExpenseCategory: builder.mutation<ExpenseCategoryType, { id: number; data: Partial<{ code: string; name: string; is_active: boolean }> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_CATEGORIES}${id}/`,
				method: 'PATCH',
				data,
			}),
			invalidatesTags: ['Expenses'],
		}),
		deleteExpenseCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_CATEGORIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Expenses'],
		}),
		getExpenses: builder.query<PaginationResponseType<ExpenseType>, ListParams>({
			query: ({ store, search, page = 1, pageSize = 10, ...filters }) => ({
				url: process.env.NEXT_PUBLIC_FINANCE_ROOT,
				method: 'GET',
				params: { store, search, page, page_size: pageSize, ...filters },
			}),
			providesTags: ['Expenses'],
		}),
		getExpense: builder.query<ExpenseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_ROOT}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Expenses'],
		}),
		addExpense: builder.mutation<ExpenseType, ExpensePayload>({
			query: (data) => ({
				url: process.env.NEXT_PUBLIC_FINANCE_ROOT,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Expenses', 'Reports'],
		}),
		editExpense: builder.mutation<ExpenseType, { id: number; data: ExpensePayload }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_ROOT}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Expenses', 'Reports'],
		}),
		deleteExpense: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_ROOT}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Expenses', 'Reports'],
		}),
		bulkDeleteExpenses: builder.mutation<{ deleted: number }, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_FINANCE_ROOT}bulk-delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Expenses', 'Reports'],
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
	useAddCategoryMutation,
	useAddExpenseCategoryMutation,
	useAddExpenseMutation,
	useAddInventorySessionMutation,
	useAddAttendanceRecordMutation,
	useAddProductUnitMutation,
	useAddPromotionMutation,
	useAddPurchaseMutation,
	useAddStoreMutation,
	useAddProductMutation,
	useAddStockTransferMutation,
	useAdjustStockMutation,
	useBulkDeleteExpensesMutation,
	useBulkDeleteInventorySessionsMutation,
	useBulkDeleteProductsMutation,
	useBulkDeletePurchasesMutation,
	useBulkDeleteStoresMutation,
	useBulkDeleteStockBalancesMutation,
	useBulkDeleteStockTransfersMutation,
	useCreateSaleMutation,
	useDeleteAttendanceRecordMutation,
	useDeleteCategoryMutation,
	useDeleteExpenseCategoryMutation,
	useDeleteExpenseMutation,
	useDeleteInventorySessionMutation,
	useDeleteProductMutation,
	useDeleteProductUnitMutation,
	useDeletePromotionMutation,
	useDeletePurchaseMutation,
	useDeleteStoreMutation,
	useDeleteStockBalanceMutation,
	useDeleteStockTransferMutation,
	useEditAttendanceRecordMutation,
	useEditCategoryMutation,
	useEditExpenseCategoryMutation,
	useEditExpenseMutation,
	useEditInventorySessionMutation,
	useEditProductMutation,
	useEditProductUnitMutation,
	useEditPromotionMutation,
	useEditPurchaseMutation,
	useEditStoreMutation,
	useEditStockTransferMutation,
	useGetActivityHistoryQuery,
	useGetAttendanceRecordQuery,
	useGetAttendanceRecordsQuery,
	useGetCategoriesQuery,
	useGetDashboardStatsQuery,
	useGetDashboardReportQuery,
	useGetEmployeesQuery,
	useGetExpenseCategoriesQuery,
	useGetExpenseQuery,
	useGetExpensesQuery,
	useGetInventorySessionQuery,
	useGetInventorySessionsQuery,
	useGetMyStoresQuery,
	useGetPaymentModesQuery,
	useGetProductQuery,
	useGetProductUnitsQuery,
	useGetProductsQuery,
	useGetPromotionQuery,
	useGetPromotionsQuery,
	useGetPurchaseQuery,
	useGetPurchasesQuery,
	useGetSaleQuery,
	useGetSalesQuery,
	useGetStoreQuery,
	useGetStoreRolesQuery,
	useGetStoresQuery,
	useGetStockBalanceQuery,
	useGetStockBalancesQuery,
	useGetStockTransferQuery,
	useGetStockTransfersQuery,
	useImportAttendanceMutation,
	useImportProductsMutation,
	useLazyScanProductQuery,
	useReceivePurchaseMutation,
	useSendCSVExampleEmailMutation,
	useSyncOfflineSalesMutation,
	useValidateStockTransferMutation,
	useUpdateStockThresholdMutation,
	useValidateInventorySessionMutation,
	useVoidSaleMutation,
} = magasinApi;
