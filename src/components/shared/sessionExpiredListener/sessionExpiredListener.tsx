'use client';

import { useContext, useEffect, useEffectEvent } from 'react';
import { ToastContext } from '@/contexts/toastContext';
import { useLanguage } from '@/utils/hooks';

/**
 * Listens for the global 'session-expired' event and displays
 * a toast notification when the session expires.
 * Must be mounted inside ToastContextProvider.
 */
const SessionExpiredListener = () => {
	const toast = useContext(ToastContext);
	const { t } = useLanguage();
	const showExpiredMessage = useEffectEvent(() => toast?.onError(t.errors.sessionExpired));

	useEffect(() => {
		const handler = () => showExpiredMessage();
		window.addEventListener('session-expired', handler);
		return () => window.removeEventListener('session-expired', handler);
	}, []);

	return null;
};

export default SessionExpiredListener;
