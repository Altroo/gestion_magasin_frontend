'use client';

import { useEffect, useRef, useState } from 'react';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Typography } from '@mui/material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { useAppSelector, useLanguage, useToast } from '@/utils/hooks';
import { getAppVersions } from '@/store/selectors';
import { isNewerAppVersion } from '@/utils/appVersion';
import { APP_UPDATE_PARAM, getAppUpdateUrl, reloadApp } from '@/utils/updateApp';

const AppUpdate = () => {
	const { localVersion, serverVersion, maintenance } = useAppSelector(getAppVersions);
	const { t } = useLanguage();
	const { onError } = useToast();
	const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
	const [updating, setUpdating] = useState(false);
	const inFlight = useRef(false);
	const latestState = useRef({ serverVersion, maintenance });
	useEffect(() => {
		latestState.current = { serverVersion, maintenance };
	}, [serverVersion, maintenance]);

	useEffect(() => {
		const url = new URL(window.location.href);
		const target = url.searchParams.get(APP_UPDATE_PARAM)?.split('-')[0];
		if (target && !isNewerAppVersion(target, localVersion)) {
			url.searchParams.delete(APP_UPDATE_PARAM);
			window.history.replaceState(window.history.state, '', url.href);
		}
	}, [localVersion]);

	if (maintenance || !isNewerAppVersion(serverVersion, localVersion) || dismissedVersion === serverVersion) return null;
	const dismiss = () => {
		if (!inFlight.current) setDismissedVersion(serverVersion);
	};
	const update = async () => {
		if (!serverVersion || inFlight.current) return;
		inFlight.current = true;
		setUpdating(true);
		try {
			const url = await getAppUpdateUrl(serverVersion, window.location.href);
			if (latestState.current.maintenance || latestState.current.serverVersion !== serverVersion) {
				onError(t.appUpdate.error);
				return;
			}
			reloadApp(url);
		} catch {
			onError(t.appUpdate.error);
		} finally {
			setUpdating(false);
			inFlight.current = false;
		}
	};

	return (
		<ActionModals
			maxWidth="xs"
			fullWidth
			title={t.appUpdate.title}
			body={t.appUpdate.body}
			titleIcon={<RefreshIcon fontSize="small" />}
			titleIconColor="#0274d7"
			onClose={dismiss}
			actions={[
				{ active: false, text: t.appUpdate.later, onClick: dismiss, disabled: updating },
				{
					active: true,
					text: updating ? t.appUpdate.updating : t.appUpdate.update,
					onClick: () => void update(),
					disabled: updating,
					color: '#0274d7',
				},
			]}
		>
			<Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
				{t.appUpdate.version} {serverVersion}
			</Typography>
		</ActionModals>
	);
};

export default AppUpdate;
