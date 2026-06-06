// Site root
export const SITE_ROOT = `${process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX}/`;
export const BACKEND_SITE_ADMIN = `${process.env.NEXT_PUBLIC_API_URL}/gestion-interne-gf62/`;
// Auth
export const AUTH_LOGIN = `${SITE_ROOT}login`;
// Auth forgot password
export const AUTH_RESET_PASSWORD = `${SITE_ROOT}reset-password`;
export const AUTH_RESET_PASSWORD_ENTER_CODE = `${SITE_ROOT}reset-password/enter-code`;
export const AUTH_RESET_PASSWORD_SET_PASSWORD = `${SITE_ROOT}reset-password/set-password`;
export const AUTH_RESET_PASSWORD_COMPLETE = `${SITE_ROOT}reset-password/set-password-complete`;
// Dashboard
export const DASHBOARD = `${SITE_ROOT}dashboard`;
export const DASHBOARD_POS = `${SITE_ROOT}dashboard/caise`;
export const DASHBOARD_CATALOG = `${SITE_ROOT}dashboard/article`;
export const DASHBOARD_STOCK = `${SITE_ROOT}dashboard/stock`;
export const DASHBOARD_STORE_STOCK = `${SITE_ROOT}dashboard/store-stock`;
export const DASHBOARD_STOCK_TRANSFERS = `${SITE_ROOT}dashboard/stock-transfers`;
export const DASHBOARD_PURCHASES = `${SITE_ROOT}dashboard/purchases`;
export const DASHBOARD_INVENTORY = `${SITE_ROOT}dashboard/inventory`;
export const DASHBOARD_SALES = `${SITE_ROOT}dashboard/sales`;
export const DASHBOARD_PROMOTIONS = `${SITE_ROOT}dashboard/promotions`;
export const DASHBOARD_EXPENSES = `${SITE_ROOT}dashboard/expenses`;
export const DASHBOARD_ATTENDANCE = `${SITE_ROOT}dashboard/pointage`;
export const DASHBOARD_STORES = `${SITE_ROOT}dashboard/stores`;
export const DASHBOARD_NOTIFICATIONS = `${SITE_ROOT}dashboard/settings/notifications`;
const storeQuery = (storeId?: number) => (storeId ? `?store_id=${storeId}` : '');
// Catalog
export const CATALOG_LIST = DASHBOARD_CATALOG;
export const CATALOG_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/article/new${storeQuery(storeId)}`;
export const CATALOG_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/article/${id}${storeQuery(storeId)}`;
export const CATALOG_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/article/${id}/edit${storeQuery(storeId)}`;
// Stock
export const STOCK_LIST = DASHBOARD_STOCK;
export const STOCK_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/stock/new${storeQuery(storeId)}`;
export const STOCK_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/stock/${id}${storeQuery(storeId)}`;
export const STORE_STOCK_VIEW = (id: number, storeId?: number) => {
	const params = new URLSearchParams();
	if (storeId) {
		params.set('store_id', String(storeId));
	}
	params.set('source', 'store-stock');
	return `${SITE_ROOT}dashboard/stock/${id}?${params.toString()}`;
};
export const STOCK_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/stock/${id}/edit${storeQuery(storeId)}`;
// Stock transfers
export const STOCK_TRANSFERS_LIST = DASHBOARD_STOCK_TRANSFERS;
export const STOCK_TRANSFERS_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/stock-transfers/new${storeQuery(storeId)}`;
export const STOCK_TRANSFERS_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/stock-transfers/${id}${storeQuery(storeId)}`;
export const STOCK_TRANSFERS_EDIT = (id: number, storeId?: number) =>
	`${SITE_ROOT}dashboard/stock-transfers/${id}/edit${storeQuery(storeId)}`;
// Purchases
export const PURCHASES_LIST = DASHBOARD_PURCHASES;
export const PURCHASES_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/purchases/new${storeQuery(storeId)}`;
export const PURCHASES_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/purchases/${id}${storeQuery(storeId)}`;
export const PURCHASES_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/purchases/${id}/edit${storeQuery(storeId)}`;
// Inventory
export const INVENTORY_LIST = DASHBOARD_INVENTORY;
export const INVENTORY_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/inventory/new${storeQuery(storeId)}`;
export const INVENTORY_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/inventory/${id}${storeQuery(storeId)}`;
export const INVENTORY_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/inventory/${id}/edit${storeQuery(storeId)}`;
// Sales
export const SALES_LIST = DASHBOARD_SALES;
export const SALES_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/sales/new${storeQuery(storeId)}`;
export const SALES_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/sales/${id}${storeQuery(storeId)}`;
// Promotions
export const PROMOTIONS_LIST = DASHBOARD_PROMOTIONS;
export const PROMOTIONS_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/promotions/new${storeQuery(storeId)}`;
export const PROMOTIONS_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/promotions/${id}${storeQuery(storeId)}`;
export const PROMOTIONS_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/promotions/${id}/edit${storeQuery(storeId)}`;
// Expenses
export const EXPENSES_LIST = DASHBOARD_EXPENSES;
export const EXPENSES_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/expenses/new${storeQuery(storeId)}`;
export const EXPENSES_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/expenses/${id}${storeQuery(storeId)}`;
export const EXPENSES_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/expenses/${id}/edit${storeQuery(storeId)}`;
// Attendance
export const ATTENDANCE_LIST = DASHBOARD_ATTENDANCE;
export const ATTENDANCE_ADD = (storeId?: number) => `${SITE_ROOT}dashboard/pointage/new${storeQuery(storeId)}`;
export const ATTENDANCE_VIEW = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/pointage/${id}${storeQuery(storeId)}`;
export const ATTENDANCE_EDIT = (id: number, storeId?: number) => `${SITE_ROOT}dashboard/pointage/${id}/edit${storeQuery(storeId)}`;
// Settings
export const DASHBOARD_EDIT_PROFILE = `${SITE_ROOT}dashboard/settings/edit-profile`;
export const DASHBOARD_PASSWORD = `${SITE_ROOT}dashboard/settings/password`;
// Users (staff only)
export const USERS_LIST = `${SITE_ROOT}dashboard/users`;
export const USERS_ADD = `${SITE_ROOT}dashboard/users/new`;
export const USERS_VIEW = (id: number) => `${SITE_ROOT}dashboard/users/${id}`;
export const USERS_EDIT = (id: number) => `${SITE_ROOT}dashboard/users/${id}/edit`;
// Stores (staff only)
export const STORES_LIST = DASHBOARD_STORES;
export const STORES_ADD = `${SITE_ROOT}dashboard/stores/new`;
export const STORES_VIEW = (id: number) => `${SITE_ROOT}dashboard/stores/${id}`;
export const STORES_EDIT = (id: number) => `${SITE_ROOT}dashboard/stores/${id}/edit`;
