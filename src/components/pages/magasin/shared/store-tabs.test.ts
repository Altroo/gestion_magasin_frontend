import { isStoreTabVisible } from './store-tabs';
import type { StoreMembershipType } from '@/types/gestionMagasinTypes';

const membership = (code: string): StoreMembershipType =>
	({
		is_active: true,
		store: {
			is_active: true,
			is_global_stock: false,
			code,
		},
	}) as StoreMembershipType;

describe('isStoreTabVisible', () => {
	it('keeps MBR SOUTH hidden by default', () => {
		expect(isStoreTabVisible(membership('mbr-south'))).toBe(false);
	});

	it('allows MBR SOUTH when requested by the pointage module', () => {
		expect(isStoreTabVisible(membership('mbr-south'), true)).toBe(true);
	});

	it('keeps regular stores visible', () => {
		expect(isStoreTabVisible(membership('casablanca'))).toBe(true);
	});
});
