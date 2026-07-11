const POINTAGE_ROUTE_PREFIX = '/dashboard/pointage';

const POINTAGE_ONLY_SETTINGS_ROUTES = new Set([
	'/dashboard/settings/edit-profile',
	'/dashboard/settings/password',
]);

export const isPointageOnlyPathAllowed = (pathname: string) =>
	pathname.startsWith(POINTAGE_ROUTE_PREFIX) || POINTAGE_ONLY_SETTINGS_ROUTES.has(pathname);
