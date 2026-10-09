'use client';

import { usePathname } from 'next/navigation';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useColorMode } from '@/providers/themeProvider';
import { useLanguage } from '@/utils/hooks';

const ThemeToggle = () => {
	const { mode, toggleTheme } = useColorMode();
	const { language } = useLanguage();
	const dark = mode === 'dark';
	const label = dark
		? language === 'fr'
			? 'Activer le mode clair'
			: 'Switch to light mode'
		: language === 'fr'
			? 'Activer le mode sombre'
			: 'Switch to dark mode';
	return (
		<Tooltip title={label}>
			<IconButton color="inherit" onClick={toggleTheme} aria-label={label}>
				{dark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
			</IconButton>
		</Tooltip>
	);
};

export default ThemeToggle;

export const AuthThemeToggle = () => {
	const pathname = usePathname();
	if (pathname !== '/login' && !pathname?.startsWith('/reset-password')) return null;
	return (
		<Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
			<ThemeToggle />
		</Box>
	);
};
