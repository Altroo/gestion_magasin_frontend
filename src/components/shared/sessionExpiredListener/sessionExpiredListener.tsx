'use client';

import { useContext, useEffect } from 'react';
import { ToastContext } from '@/contexts/toastContext';
import { useLanguage } from '@/utils/hooks';

/**
 * Listens for the global 'session-expired' event and displays
 * a toast notification when the session expires.
 * Must be mounted inside ToastContextProvider.
 */
const SessionExpiredListener: React.FC = () => {
	const toast = useContext(ToastContext);
	const { t } = useLanguage();

	useEffect(() => {
		const handler = () => {
			toast?.onError(t.errors.sessionExpired);
		};
		window.addEventListener('session-expired', handler);
		return () => window.removeEventListener('session-expired', handler);
	}, [toast, t]);

	return null;
};

export default SessionExpiredListener;
