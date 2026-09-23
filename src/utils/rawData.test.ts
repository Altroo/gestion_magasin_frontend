import {
	actionButtonSx,
	ALL_STORES_CODE,
	baseAdminPermissionFields,
	CHART_COLORS,
	CHART_OPTS,
	chartOptions,
	DEFAULT_ATTENDANCE_RESPONSIBLE,
	doughnutOptions,
	doughnutPalette,
	EMPTY_INVENTORY_LINE,
	EMPTY_PROMOTION_LINE,
	EMPTY_PURCHASE_LINE,
	EMPTY_SALE_LINE,
	EMPTY_STOCK_TRACKING_ITEM,
	EMPTY_STOCK_TRANSFER_LINE,
	fields,
	genderItemsList,
	ITEM_HEIGHT,
	ITEM_PADDING_TOP,
	legendChartOptions,
	OFFLINE_KEY,
	permissionFields,
	pointageOnlyPermissionDefaults,
	PROJECT_COLORS,
	selectMenuProps,
	shiftStartMinutes,
	STATUS_VISUALS,
	WORKFLOW_STATUS_VISUALS,
} from './rawData';
import { translations } from '@/translations';

const t = translations.fr;

describe('items lists', () => {
	it('provides the dashboard chart settings', () => {
		expect(CHART_OPTS.responsive).toBe(true);
		expect(CHART_COLORS.primary).toContain('rgba(');
		expect(PROJECT_COLORS).toHaveLength(8);
		expect(doughnutPalette).toHaveLength(8);
		expect(ALL_STORES_CODE).toBe('__all_stores__');
		expect(chartOptions.plugins.legend.display).toBe(false);
		expect(legendChartOptions.plugins.legend.position).toBe('top');
		expect(doughnutOptions.cutout).toBe('64%');
	});

	it('provides independent empty form templates', () => {
		expect(EMPTY_INVENTORY_LINE.expected_quantity).toBe('0');
		expect(EMPTY_PROMOTION_LINE.quantity).toBe('1');
		expect(EMPTY_STOCK_TRANSFER_LINE.quantity).toBe('1');
		expect(EMPTY_SALE_LINE.type).toBe('product');
		expect(EMPTY_PURCHASE_LINE.unit_cost).toBe('0');
		expect(EMPTY_STOCK_TRACKING_ITEM.requires_expiration_date).toBe(false);
		expect(fields).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
	});

	it('provides attendance, permission, POS, and menu defaults', () => {
		expect(DEFAULT_ATTENDANCE_RESPONSIBLE).toBe('Mehdi Zorgane');
		expect(shiftStartMinutes).toEqual({ morning: 540, afternoon: 900, evening: 1140 });
		expect(permissionFields).toContain('can_wholesale_sale');
		expect(baseAdminPermissionFields).not.toContain('can_wholesale_sale');
		expect(pointageOnlyPermissionDefaults.can_create).toBe(true);
		expect(OFFLINE_KEY).toBe('gestion-magasin-offline-sales');
		expect(actionButtonSx.minHeight).toBe(56);
		expect((selectMenuProps.slotProps?.paper as { style: { maxHeight: number } }).style.maxHeight).toBe(
			ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
		);
	});

	it('provides status color and icon mappings', () => {
		expect(WORKFLOW_STATUS_VISUALS.received.color).toBe('success');
		expect(WORKFLOW_STATUS_VISUALS.cancelled.color).toBe('error');
		expect(STATUS_VISUALS.active.color).toBe('success');
		expect(STATUS_VISUALS.credit.color).toBe('warning');
		expect(STATUS_VISUALS.active.icon).toBeDefined();
	});

	describe('genderItemsList', () => {
		it('has two entries with correct codes and values', () => {
			const items = genderItemsList(t);
			expect(items).toHaveLength(2);

			expect(items[0]).toEqual({ code: 'H', value: t.rawData.genders.male });
			expect(items[1]).toEqual({ code: 'F', value: t.rawData.genders.female });

			const codes = items.map((i) => i.code);
			expect(codes).toEqual(['H', 'F']);

			const values = items.map((i) => i.value);
			expect(values).toEqual([t.rawData.genders.male, t.rawData.genders.female]);
		});

		it('contains unique codes', () => {
			const codes = genderItemsList(t).map((i) => i.code);
			const unique = Array.from(new Set(codes));
			expect(unique).toHaveLength(codes.length);
		});
	});
});
