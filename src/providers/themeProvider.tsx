'use client';

import { type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';

const ThemeProvider = ({ children }: { children: ReactNode }) => {
	return <MuiThemeProvider theme={getDefaultTheme()}>{children}</MuiThemeProvider>;
};

export default ThemeProvider;
