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
	is_global_stock: boolean;
	members_count?: number;
	managed_by?: StoreManagedByType[];
};

export type StorePayload = {
	name: string;
	code: string;
	address: string;
	phone: string;
	is_active: boolean;
	is_global_stock?: boolean;
	managed_by?: Array<{ pk: number; role: StoreRoleCode; role_name?: string }>;
};

export type StoreFormValues = StorePayload & {
	managed_by: Array<{ pk: number; role: StoreRoleCode }>;
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

export type StoreManagedByType = {
	pk: number;
	role: StoreRoleCode;
	role_name: string;
	membership_id?: number;
};

export type CategoryType = {
	id: number;
	code: string;
	name: string;
	is_active: boolean;
	date_created?: string;
	date_updated?: string;
};

export type ProductUnitType = {
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
	unit: number;
	unit_name: string;
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
	unit: number;
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

export type SalePromotionLineType = {
	id: number;
	promotion: number;
	promotion_name: string;
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
	promotion_lines: SalePromotionLineType[];
};

export type SaleCreatePayload = {
	store: number;
	lines?: Array<{
		product: number;
		quantity: string;
		unit_price?: string;
	}>;
	promotion_lines?: Array<{
		promotion: number;
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
	type: 'product' | 'promotion';
	product: string;
	promotion: string;
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

export type DashboardReportType = {
	store: { id: number | null; name: string };
	period: { date_from: string; date_to: string };
	kpis: {
		sales_count: number;
		sales_total: string;
		expenses_total: string;
		purchases_total: string;
		net_total: string;
		low_stock_count: number;
		expired_count: number;
		expiring_count: number;
		products_count: number;
		categories_count: number;
		customers_count: number;
		promotions_active_count: number;
		transfers_count: number;
		attendance_hours: string;
		attendance_delay_minutes: number;
	};
	sales_trend: Array<{ date: string; total: string; count: number }>;
	purchases_trend: Array<{ date: string; total: string; count: number }>;
	expenses_trend: Array<{ date: string; total: string; count: number }>;
	attendance_trend: Array<{ date: string; hours: string; delay: number }>;
	stock_by_store: Array<{ store: string; quantity: string }>;
	low_stock_by_store: Array<{ store: string; count: number }>;
	transfers_by_status: Array<{ status: string; count: number }>;
	inventory_by_status: Array<{ status: string; count: number }>;
	promotions_by_status: Array<{ status: string; count: number }>;
	stock_alerts: Array<{ id: number; product: string; quantity: string; min_stock: string }>;
};

export type ExpenseCategoryType = {
	id: number;
	code: string;
	name: string;
	is_active: boolean;
};

export type ExpenseType = {
	id: number;
	store: number;
	store_name: string;
	category: number;
	category_name: string;
	label: string;
	amount: string;
	payment_status: 'paid' | 'payable';
	payment_mode: 'cash' | 'card' | 'transfer' | 'other';
	expense_date: string;
	note: string;
	created_by?: number | null;
	created_by_email?: string | null;
	date_created?: string;
	date_updated?: string;
};

export type ExpensePayload = {
	store: number;
	category: number;
	label: string;
	amount: string;
	payment_status: 'paid' | 'payable';
	payment_mode: 'cash' | 'card' | 'transfer' | 'other';
	expense_date: string;
	note?: string;
};

export type PurchaseLineType = {
	id: number;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	quantity: string;
	unit_cost: string;
	total: string;
};

export type PurchaseType = {
	id: number;
	store: number;
	store_name: string;
	supplier_name: string;
	reference: string;
	purchase_date: string;
	status: 'draft' | 'received' | 'cancelled';
	subtotal: string;
	note: string;
	created_by?: number | null;
	created_by_email?: string | null;
	received_by?: number | null;
	received_by_email?: string | null;
	received_at?: string | null;
	date_created?: string;
	date_updated?: string;
	lines: PurchaseLineType[];
};

export type PurchasePayload = {
	store: number;
	supplier_name?: string;
	reference?: string;
	purchase_date?: string;
	status: 'draft' | 'received' | 'cancelled';
	note?: string;
	lines: Array<{ product: number; quantity: string; unit_cost: string }>;
};

export type InventoryLineType = {
	id: number;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	expected_quantity: string;
	counted_quantity: string;
	difference: string;
	note: string;
};

export type InventorySessionType = {
	id: number;
	store: number;
	store_name: string;
	code: string;
	title: string;
	inventory_date: string;
	status: 'draft' | 'validated' | 'cancelled';
	note: string;
	created_by?: number | null;
	created_by_email?: string | null;
	validated_by?: number | null;
	validated_by_email?: string | null;
	validated_at?: string | null;
	date_created?: string;
	date_updated?: string;
	lines: InventoryLineType[];
};

export type InventoryPayload = {
	store: number;
	code: string;
	title: string;
	inventory_date?: string;
	status: 'draft' | 'validated' | 'cancelled';
	note?: string;
	lines: Array<{ product: number; expected_quantity?: string; counted_quantity: string; note?: string }>;
};

export type StockTransferLineType = {
	id: number;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	quantity: string;
};

export type StockTransferType = {
	id: number;
	source_store: number;
	source_store_name: string;
	target_store: number;
	target_store_name: string;
	reference: string;
	transfer_date: string;
	status: 'draft' | 'validated' | 'cancelled';
	note: string;
	created_by?: number | null;
	created_by_email?: string | null;
	validated_by?: number | null;
	validated_by_email?: string | null;
	validated_at?: string | null;
	date_created?: string;
	date_updated?: string;
	lines: StockTransferLineType[];
};

export type StockTransferPayload = {
	store: number;
	target_store: number;
	reference?: string;
	transfer_date?: string;
	status: 'draft' | 'validated' | 'cancelled';
	note?: string;
	lines: Array<{ product: number; quantity: string }>;
};

export type PromotionLineType = {
	id: number;
	product: number;
	product_name: string;
	product_reference: string | null;
	product_barcode: string | null;
	quantity: string;
};

export type PromotionType = {
	id: number;
	store: number;
	store_name: string;
	name: string;
	selling_price: string;
	status: 'active' | 'expired';
	start_date: string | null;
	end_date: string | null;
	note: string;
	created_by?: number | null;
	created_by_email?: string | null;
	date_created?: string;
	date_updated?: string;
	lines: PromotionLineType[];
};

export type PromotionPayload = {
	store: number;
	name: string;
	selling_price: string;
	status: 'active' | 'expired';
	start_date?: string | null;
	end_date?: string | null;
	note?: string;
	lines: Array<{ product: number; quantity: string }>;
};

export type ActivityHistoryType = {
	model: string;
	object_id: number | null;
	history_type: '+' | '~' | '-';
	history_date: string;
	history_user: string;
	label: string;
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
