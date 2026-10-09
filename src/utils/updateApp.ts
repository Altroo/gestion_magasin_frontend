import { isAppVersion, isNewerAppVersion } from '@/utils/appVersion';

export const APP_UPDATE_PARAM = '_app_update';

export const getAppUpdateUrl = async (targetVersion: string, currentUrl: string): Promise<string> => {
	if (!isAppVersion(targetVersion)) throw new Error('Invalid app version');
	// Do not reload into an old frontend if the backend was published first.
	const response = await fetch(`/api/app-version?check=${Date.now()}`, {
		cache: 'no-store',
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) throw new Error('App version check failed');
	const data: unknown = await response.json();
	if (
		!data ||
		typeof data !== 'object' ||
		!('version' in data) ||
		!isAppVersion(data.version) ||
		isNewerAppVersion(targetVersion, data.version)
	)
		throw new Error('The requested frontend version is not ready');
	const url = new URL(currentUrl);
	url.searchParams.set(APP_UPDATE_PARAM, `${targetVersion}-${Date.now()}`);
	return url.href;
};

export const reloadApp = (url: string) => window.location.replace(url);
