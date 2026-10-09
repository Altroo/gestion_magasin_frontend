'use client';

import { useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, type Theme } from '@mui/material/styles';
import { useColorMode } from '@/providers/themeProvider';
import { applyColorMode } from '@/utils/colorMode';

// Nested input/grid/navigation themes must not reset the user's selected mode.
export const ThemeProvider = ({ theme, children }: { theme: Theme; children: ReactNode }) => {
	const { mode } = useColorMode();
	const scopedTheme = useMemo(() => applyColorMode(theme, mode), [theme, mode]);
	return <MuiThemeProvider theme={scopedTheme}>{children}</MuiThemeProvider>;
};
