import type { StoreMembershipType } from '@/types/gestionMagasinTypes';

const VENDEUR_ALLOWED_PATHS = new Set([
	'/dashboard/caise',
	'/dashboard/settings/edit-profile',
	'/dashboard/settings/password',
]);

export const isVendeurOnly = (memberships: StoreMembershipType[]) => {
	const activeMemberships = memberships.filter(
		(membership) => membership.is_active && membership.store.is_active && !membership.store.is_global_stock,
	);
	return activeMemberships.length > 0 && activeMemberships.every((membership) => membership.role.code === 'vendeur');
};

export const isVendeurPathAllowed = (pathname: string) => VENDEUR_ALLOWED_PATHS.has(pathname);
