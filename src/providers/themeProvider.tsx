'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';
import { applyColorMode, type ColorMode } from '@/utils/colorMode';

const ColorModeContext = createContext<{ mode: ColorMode; toggleTheme: () => void }>({
	mode: 'light',
	toggleTheme: () => {},
});
export const useColorMode = () => useContext(ColorModeContext);

const ThemeProvider = ({ children, initialTheme = 'light' }: { children: ReactNode; initialTheme?: ColorMode }) => {
	const [mode, setMode] = useState<ColorMode>(initialTheme);
	const theme = useMemo(() => applyColorMode(getDefaultTheme(), mode), [mode]);

	useEffect(() => {
		document.documentElement.dataset.theme = mode;
		document.cookie = 'app-theme=' + mode + ';path=/;max-age=31536000;SameSite=Lax';
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', mode === 'dark' ? '#121722' : '#ffffff');
	}, [mode]);

	return (
		<ColorModeContext
			value={{ mode, toggleTheme: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')) }}
		>
			<MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
		</ColorModeContext>
	);
};

export default ThemeProvider;
