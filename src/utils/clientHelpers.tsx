'use client';

import { type ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useIsClient } from '@/utils/hooks';

type MediaQueryProps = {
	children: ReactNode;
};

/**
 * Desktop: only screen and (min-width: 992px)
 */
export const Desktop = ({ children }: MediaQueryProps) => {
	const theme = useTheme();
	const isClient = useIsClient();
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

	// Return null on server to match initial client render
	if (!isClient) {
		return null;
	}

	return isDesktop ? <>{children}</> : null;
};

/**
 * TabletAndMobile: only screen and (max-width: 991px)
 */
export const TabletAndMobile = ({ children }: MediaQueryProps) => {
	const theme = useTheme();
	const isClient = useIsClient();
	const isTabletMobile = useMediaQuery(theme.breakpoints.down('md'));

	// Return null on server to match initial client render
	if (!isClient) {
		return null;
	}

	return isTabletMobile ? <>{children}</> : null;
};
