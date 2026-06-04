// Site root
const normalizeBasePath = (value?: string) => {
	if (!value || value === '/') return '/';
	return `/${value.replace(/^\/+|\/+$/g, '')}/`;
};

export const SITE_ROOT = normalizeBasePath(process.env.NEXT_PUBLIC_APP_BASE_PATH);
const appRoute = (path: string) => `${SITE_ROOT}${path.replace(/^\/+/, '')}`;
export const BACKEND_SITE_ADMIN = `${process.env.NEXT_PUBLIC_API_URL}/gestion-interne-gf62`;
// Auth
export const AUTH_LOGIN = appRoute('login');
// Auth forgot password
export const AUTH_RESET_PASSWORD = appRoute('reset-password');
export const AUTH_RESET_PASSWORD_ENTER_CODE = appRoute('reset-password/enter-code');
export const AUTH_RESET_PASSWORD_SET_PASSWORD = appRoute('reset-password/set-password');
export const AUTH_RESET_PASSWORD_COMPLETE = appRoute('reset-password/set-password-complete');
// Dashboard
export const DASHBOARD = appRoute('dashboard');
export const DASHBOARD_POS = appRoute('dashboard/pos');
export const DASHBOARD_CATALOG = appRoute('dashboard/catalog');
export const DASHBOARD_STOCK = appRoute('dashboard/stock');
export const DASHBOARD_SALES = appRoute('dashboard/sales');
export const DASHBOARD_ATTENDANCE = appRoute('dashboard/attendance');
export const DASHBOARD_STORES = appRoute('dashboard/stores');
export const DASHBOARD_NOTIFICATIONS = appRoute('dashboard/settings/notifications');
const storeQuery = (storeId?: number) => (storeId ? `?store_id=${storeId}` : '');
// Catalog
export const CATALOG_LIST = DASHBOARD_CATALOG;
export const CATALOG_ADD = (storeId?: number) => `${appRoute('dashboard/catalog/new')}${storeQuery(storeId)}`;
export const CATALOG_VIEW = (id: number, storeId?: number) => `${appRoute(`dashboard/catalog/${id}`)}${storeQuery(storeId)}`;
export const CATALOG_EDIT = (id: number, storeId?: number) => `${appRoute(`dashboard/catalog/${id}/edit`)}${storeQuery(storeId)}`;
// Stock
export const STOCK_LIST = DASHBOARD_STOCK;
export const STOCK_ADD = (storeId?: number) => `${appRoute('dashboard/stock/new')}${storeQuery(storeId)}`;
export const STOCK_VIEW = (id: number, storeId?: number) => `${appRoute(`dashboard/stock/${id}`)}${storeQuery(storeId)}`;
export const STOCK_EDIT = (id: number, storeId?: number) => `${appRoute(`dashboard/stock/${id}/edit`)}${storeQuery(storeId)}`;
// Sales
export const SALES_LIST = DASHBOARD_SALES;
export const SALES_ADD = (storeId?: number) => `${appRoute('dashboard/sales/new')}${storeQuery(storeId)}`;
export const SALES_VIEW = (id: number, storeId?: number) => `${appRoute(`dashboard/sales/${id}`)}${storeQuery(storeId)}`;
// Attendance
export const ATTENDANCE_LIST = DASHBOARD_ATTENDANCE;
export const ATTENDANCE_ADD = (storeId?: number) => `${appRoute('dashboard/attendance/new')}${storeQuery(storeId)}`;
export const ATTENDANCE_VIEW = (id: number, storeId?: number) => `${appRoute(`dashboard/attendance/${id}`)}${storeQuery(storeId)}`;
export const ATTENDANCE_EDIT = (id: number, storeId?: number) => `${appRoute(`dashboard/attendance/${id}/edit`)}${storeQuery(storeId)}`;
// Settings
export const DASHBOARD_EDIT_PROFILE = appRoute('dashboard/settings/edit-profile');
export const DASHBOARD_PASSWORD = appRoute('dashboard/settings/password');
// Users (staff only)
export const USERS_LIST = appRoute('dashboard/users');
export const USERS_ADD = appRoute('dashboard/users/new');
export const USERS_VIEW = (id: number) => appRoute(`dashboard/users/${id}`);
export const USERS_EDIT = (id: number) => appRoute(`dashboard/users/${id}/edit`);
// Stores (staff only)
export const STORES_LIST = DASHBOARD_STORES;
export const STORES_ADD = appRoute('dashboard/stores/new');
export const STORES_VIEW = (id: number) => appRoute(`dashboard/stores/${id}`);
export const STORES_EDIT = (id: number) => appRoute(`dashboard/stores/${id}/edit`);
