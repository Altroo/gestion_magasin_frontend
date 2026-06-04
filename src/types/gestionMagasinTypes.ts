export type StoreRoleCode = 'direction' | 'responsable' | 'vendeur' | 'lecture';

export type StoreRoleType = {
	id: number;
	code: StoreRoleCode;
	name: string;
	rank: number;
};

export type StoreType = {
	id: number;
	name: string;
	code: string;
	address: string;
	phone: string;
	is_active: boolean;
	members_count?: number;
};

export type StorePayload = {
	name: string;
	code: string;
	address: string;
	phone: string;
	is_active: boolean;
};

export type StoreFormValues = StorePayload & {
	globalError: string;
};

export type StoreMembershipType = {
	id: number;
	store: StoreType;
	role: StoreRoleType;
	is_active: boolean;
};

export type UserStoreAssignmentType = {
	membership_id: number;
	store_id: number;
	store_name: string;
	role: StoreRoleCode;
	role_name: string;
	is_active: boolean;
};

export type CategoryType = {
	id: number;
	code: string;
	name: string;
	is_active: boolean;
	date_created?: string;
	date_updated?: string;
};

export type ProductType = {
	id: number;
	reference: string | null;
	barcode: string | null;
	name: string;
	category: number | null;
	category_name: string | null;
	unit: string;
	purchase_price: string;
	wholesale_price: string;
	detail_price: string;
	counter_price: string;
	default_stock_alert: string;
	expiration_date: string | null;
	shelf_life_days?: number | null;
	compliance_required: boolean;
	is_active: boolean;
	available_stock: string | null;
	min_stock: string | null;
	date_created?: string;
	date_updated?: string;
};

export type ProductPayload = {
	reference?: string | null;
	barcode?: string | null;
	name: string;
	category?: number | null;
	unit: string;
	purchase_price: string;
	wholesale_price: string;
	detail_price: string;
	counter_price: string;
	default_stock_alert: string;
	expiration_date?: string | null;
	shelf_life_days?: number | null;
	compliance_required: boolean;
	is_active: boolean;
};

export type StockBalanceType = {
	id: number;
	store: number;
	store_name: string;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	category_name: string | null;
	quantity: string;
	min_stock: string | null;
	effective_min_stock: string;
	is_low_stock: boolean;
	average_cost: string;
	low_stock_notified_at?: string | null;
	date_created?: string;
	date_updated?: string;
};

export type SaleLineType = {
	id: number;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	quantity: string;
	unit_price: string;
	total: string;
};

export type SaleType = {
	id: number;
	store: number;
	store_name: string;
	seller?: number | null;
	seller_email?: string | null;
	customer?: number | null;
	customer_name?: string | null;
	payment_mode?: number | null;
	payment_mode_name?: string | null;
	status: 'confirmed' | 'void';
	payment_status: 'paid' | 'credit';
	subtotal: string;
	discount_amount: string;
	total: string;
	paid_amount: string;
	change_amount: string;
	idempotency_key?: string;
	offline_created_at?: string | null;
	note?: string;
	void_reason?: string;
	voided_by?: number | null;
	voided_at?: string | null;
	date_created: string;
	date_updated?: string;
	lines: SaleLineType[];
};

export type SaleCreatePayload = {
	store: number;
	lines: Array<{
		product: number;
		quantity: string;
		unit_price?: string;
	}>;
	payment_mode_code?: string;
	payment_status?: 'paid' | 'credit';
	discount_amount?: string;
	paid_amount?: string;
	idempotency_key?: string;
	note?: string;
};

export type SaleFormLineValues = {
	product: string;
	quantity: string;
	unit_price: string;
};

export type SaleFormValues = {
	payment_status: 'paid' | 'credit';
	paid_amount: string;
	discount_amount: string;
	note: string;
	lines: SaleFormLineValues[];
	globalError: string;
};

export type DashboardStatsType = {
	sales_count: number;
	total_sales: string;
	low_stock_count: number;
	products_count: number;
};

export type EmployeeType = {
	id: number;
	store: number;
	store_name: string;
	full_name: string;
	position: string;
	is_active: boolean;
};

export type AttendanceRecordType = {
	id: number;
	store: number;
	store_name: string;
	employee: number;
	employee_name: string;
	date: string;
	clock_in: string | null;
	break_start: string | null;
	break_end: string | null;
	clock_out: string | null;
	hours_worked: string;
	delay_minutes: number;
	status: 'present' | 'off' | 'absent';
	responsible: string;
	observations: string;
	created_by?: number | null;
	created_by_email?: string | null;
	date_created?: string;
	date_updated?: string;
};

export type AttendancePayload = {
	store: number;
	employee: number;
	date: string;
	clock_in?: string | null;
	break_start?: string | null;
	break_end?: string | null;
	clock_out?: string | null;
	hours_worked: string;
	delay_minutes: number;
	status: 'present' | 'off' | 'absent';
	responsible?: string;
	observations?: string;
};

export type NotificationType = {
	id: number;
	title: string;
	message: string;
	notification_type: 'low_stock';
	object_id: number | null;
	store?: number | null;
	product?: number | null;
	is_read: boolean;
	date_created: string;
};

export type NotificationPreferenceType = {
	id: number;
	notify_low_stock: boolean;
	low_stock_repeat_hours: number;
	browser_notifications: boolean;
};

export type PosScanFormValues = {
	barcode: string;
	globalError: string;
};

export type StockAdjustmentFormValues = {
	product: string;
	quantity: string;
	min_stock?: string;
	note?: string;
	globalError: string;
};

export type AttendanceFormValues = {
	employee: string;
	date: string;
	clock_in: string;
	break_start: string;
	break_end: string;
	clock_out: string;
	hours_worked: string;
	delay_minutes: string;
	status: 'present' | 'off' | 'absent' | '';
	responsible: string;
	observations: string;
	globalError: string;
};

export type ProductFormValues = {
	reference: string;
	barcode: string;
	name: string;
	category: string;
	unit: string;
	purchase_price: string;
	wholesale_price: string;
	detail_price: string;
	counter_price: string;
	default_stock_alert: string;
	expiration_date: string;
	shelf_life_days: string;
	compliance_required: boolean;
	is_active: boolean;
	globalError: string;
};

export type NotificationPreferenceFormValues = {
	notify_low_stock: boolean;
	browser_notifications: boolean;
	low_stock_repeat_hours: string;
	globalError: string;
};
