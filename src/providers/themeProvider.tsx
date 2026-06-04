'use client';

import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { getDefaultTheme } from '@/utils/themes';

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	return <MuiThemeProvider theme={getDefaultTheme()}>{children}</MuiThemeProvider>;
};

export default ThemeProvider;
