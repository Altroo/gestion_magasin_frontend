'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/utils/hooks';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { initAppAction, initAppSessionTokensAction } from '@/store/actions/_initActions';
import { getAccessToken } from '@/store/selectors';
import { useGetProfilQuery } from '@/store/services/account';
import { useGetMyStoresQuery } from '@/store/services/magasin';
import { accountSetProfilAction } from '@/store/actions/accountActions';
import { DASHBOARD_ATTENDANCE, DASHBOARD_PASSWORD, DASHBOARD_POS } from '@/utils/routes';
import { isPointageOnlyPathAllowed } from '@/utils/pointageOnlyAccess';
import { isVendeurOnly, isVendeurPathAllowed } from '@/utils/vendeurAccess';

const PASSWORD_ROUTE = '/dashboard/settings/password';

export const InitEffects: React.FC = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const initState = useAppSelector(getAccessToken);
	const accessToken = initState ?? undefined;
	const skip = !accessToken || status !== 'authenticated';

	const appInitializedRef = useRef(false);
	const lastAccessTokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!appInitializedRef.current) {
			dispatch(initAppAction());
			appInitializedRef.current = true;
		}
	}, [dispatch]);

	const { data: user } = useGetProfilQuery(undefined, { skip });
	const { data: storeMemberships = [] } = useGetMyStoresQuery(undefined, { skip });
	const vendeurOnly = !user?.is_staff && isVendeurOnly(storeMemberships);

	// Sync Redux tokens whenever the access token changes (covers initial login + every refresh)
	useEffect(() => {
		if (status === 'authenticated' && session?.accessToken &&
			lastAccessTokenRef.current !== session.accessToken) {
			lastAccessTokenRef.current = session.accessToken;
			dispatch(initAppSessionTokensAction(session));
		}
		if (status !== 'authenticated') {
			lastAccessTokenRef.current = null;
		}
	}, [status, session, dispatch]);

	// Dispatch user profile to Redux
	useEffect(() => {
		if (user) dispatch(accountSetProfilAction(user));
	}, [dispatch, user]);

	// Password setup takes priority over role-based route restrictions.
	useEffect(() => {
		if (user?.default_password_set) {
			if (pathname !== PASSWORD_ROUTE) {
				router.push(DASHBOARD_PASSWORD);
			}
			return;
		}
		if (user?.pointage_only && !isPointageOnlyPathAllowed(pathname)) {
			router.replace(DASHBOARD_ATTENDANCE);
			return;
		}
		if (vendeurOnly && !isVendeurPathAllowed(pathname)) {
			router.replace(DASHBOARD_POS);
		}
	}, [user, vendeurOnly, pathname, router]);

	return null;
};
