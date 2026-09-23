import type { AccountGenderCodeValueType, PasswordResetCodeField, UserPermissionField } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';
import type { AttendanceShiftType } from '@/types/gestionMagasinTypes';
import type { MenuProps as MuiMenuProps } from '@mui/material/Menu';
import {
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	Description as DraftIcon,
	PendingActions as PendingActionsIcon,
} from '@mui/icons-material';
import type { StatusVisual } from '@/types/uiTypes';

export const genderItemsList = (t: TranslationDictionary): Array<AccountGenderCodeValueType> => [
	{ code: 'H', value: t.rawData.genders.male },
	{ code: 'F', value: t.rawData.genders.female },
];

export const fields: PasswordResetCodeField[] = ['one', 'two', 'three', 'four', 'five', 'six'];

export const permissionFields: UserPermissionField[] = [
	'can_view',
	'can_print',
	'can_create',
	'can_edit',
	'can_delete',
	'can_create_promotion',
	'can_wholesale_sale',
];

export const baseAdminPermissionFields: Exclude<UserPermissionField, 'can_create_promotion' | 'can_wholesale_sale'>[] =
	['can_view', 'can_print', 'can_create', 'can_edit', 'can_delete'];

export const CHART_COLORS = {
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.15)',
	secondary: 'rgba(46, 125, 50, 0.8)',
	secondaryLight: 'rgba(46, 125, 50, 0.15)',
	warning: 'rgba(237, 108, 2, 0.8)',
	warningLight: 'rgba(237, 108, 2, 0.15)',
	error: 'rgba(211, 47, 47, 0.8)',
	errorLight: 'rgba(211, 47, 47, 0.15)',
	info: 'rgba(2, 136, 209, 0.8)',
	infoLight: 'rgba(2, 136, 209, 0.15)',
	purple: 'rgba(156, 39, 176, 0.8)',
	purpleLight: 'rgba(156, 39, 176, 0.15)',
};

export const PROJECT_COLORS = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(237, 108, 2, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(2, 136, 209, 0.8)',
	'rgba(255, 193, 7, 0.8)',
	'rgba(211, 47, 47, 0.8)',
	'rgba(0, 150, 136, 0.8)',
];

export const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;

export const ALL_STORES_CODE = '__all_stores__';

export const doughnutPalette = ['#1d4ed8', '#047857', '#b91c1c', '#c2410c', '#6d28d9', '#0f766e', '#be123c', '#4d7c0f'];

export const chartOptions = {
	...CHART_OPTS,
	plugins: {
		legend: { display: false },
	},
	scales: {
		x: { grid: { display: false } },
		y: { beginAtZero: true },
	},
};

export const legendChartOptions = {
	...chartOptions,
	interaction: { mode: 'index' as const, intersect: false },
	plugins: {
		legend: {
			display: true,
			position: 'top' as const,
		},
	},
	scales: {
		x: { grid: { color: 'rgba(0, 0, 0, 0.04)' } },
		y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.06)' } },
	},
};

export const doughnutOptions = {
	...CHART_OPTS,
	cutout: '64%',
	plugins: {
		legend: {
			display: true,
			position: 'bottom' as const,
		},
	},
};

export const EMPTY_INVENTORY_LINE = { product: '', expected_quantity: '0', counted_quantity: '0', note: '' };

export const EMPTY_PROMOTION_LINE = { product: '', quantity: '1' };

export const EMPTY_STOCK_TRANSFER_LINE = { product: '', quantity: '1' };

export const EMPTY_SALE_LINE = { type: 'product' as const, product: '', promotion: '', quantity: '1', unit_price: '0' };

export const EMPTY_PURCHASE_LINE = { product: '', quantity: '1', unit_cost: '0' };

export const EMPTY_STOCK_TRACKING_ITEM = {
	default_stock_alert: '',
	expiration_date: '',
	requires_expiration_date: false,
	shelf_life_days: '',
};

export const DEFAULT_ATTENDANCE_RESPONSIBLE = 'Mehdi Zorgane';

export const shiftStartMinutes: Record<Exclude<AttendanceShiftType, 'off'>, number> = {
	morning: 9 * 60,
	afternoon: 15 * 60,
	evening: 19 * 60,
};

export const pointageOnlyPermissionDefaults = {
	is_staff: false,
	can_view: true,
	can_print: false,
	can_create: true,
	can_edit: true,
	can_delete: true,
	can_create_promotion: false,
	can_wholesale_sale: false,
};

export const OFFLINE_KEY = 'gestion-magasin-offline-sales';

export const actionButtonSx = {
	borderRadius: 2,
	minHeight: 56,
	px: 2,
	textTransform: 'none',
	fontFamily: 'Poppins',
	fontSize: '0.95rem',
	fontWeight: 600,
};

export const ITEM_HEIGHT = 48;

export const ITEM_PADDING_TOP = 8;

export const selectMenuProps: Partial<MuiMenuProps> = {
	slotProps: {
		paper: {
			style: {
				maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
				width: 250,
			},
		},
	},
};

export const WORKFLOW_STATUS_VISUALS: Record<string, StatusVisual> = {
	received: { color: 'success', icon: CheckCircleIcon },
	validated: { color: 'success', icon: CheckCircleIcon },
	cancelled: { color: 'error', icon: CancelIcon },
	draft: { color: 'default', icon: DraftIcon },
};

export const STATUS_VISUALS: Record<string, StatusVisual> = {
	active: { color: 'success', icon: CheckCircleIcon },
	confirmed: { color: 'success', icon: CheckCircleIcon },
	paid: { color: 'success', icon: CheckCircleIcon },
	present: { color: 'success', icon: CheckCircleIcon },
	received: { color: 'success', icon: CheckCircleIcon },
	validated: { color: 'success', icon: CheckCircleIcon },
	absent: { color: 'error', icon: CancelIcon },
	cancelled: { color: 'error', icon: CancelIcon },
	expired: { color: 'error', icon: CancelIcon },
	void: { color: 'error', icon: CancelIcon },
	credit: { color: 'warning', icon: PendingActionsIcon },
	draft: { color: 'warning', icon: PendingActionsIcon },
	in_progress: { color: 'warning', icon: PendingActionsIcon },
	off: { color: 'warning', icon: PendingActionsIcon },
	payable: { color: 'warning', icon: PendingActionsIcon },
};
