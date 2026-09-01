import { isVendeurOnly, isVendeurPathAllowed } from './vendeurAccess';
import type { StoreMembershipType } from '@/types/gestionMagasinTypes';

const membership = (role: StoreMembershipType['role']['code']): StoreMembershipType => ({
	id: 1,
	store: {
		id: 1,
		name: 'Store',
		code: 'store',
		address: '',
		phone: '',
		is_active: true,
		is_global_stock: false,
	},
	role: { id: 1, code: role, name: role, rank: 3 },
	is_active: true,
});

describe('vendeur access', () => {
	it('detects users whose active store roles are all vendeur', () => {
		expect(isVendeurOnly([membership('vendeur'), membership('vendeur')])).toBe(true);
		expect(isVendeurOnly([membership('vendeur'), membership('responsable')])).toBe(false);
		expect(isVendeurOnly([])).toBe(false);
	});

	it('allows only caisse and personal settings routes', () => {
		expect(isVendeurPathAllowed('/dashboard/caise')).toBe(true);
		expect(isVendeurPathAllowed('/dashboard/settings/edit-profile')).toBe(true);
		expect(isVendeurPathAllowed('/dashboard/settings/password')).toBe(true);
		expect(isVendeurPathAllowed('/dashboard')).toBe(false);
		expect(isVendeurPathAllowed('/dashboard/sales')).toBe(false);
	});
});
