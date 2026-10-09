import type {} from '@mui/x-data-grid/themeAugmentation';
import { createTheme, type Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

export const resolveColorMode = (value: string | undefined): ColorMode => (value === 'dark' ? 'dark' : 'light');

// Dark palette mirrors Design Workflow; use its blue text token for Gestion Magasin's blue accent.
// Keep each component's typography, spacing and overrides while sharing the app palette.
export const applyColorMode = (theme: Theme, mode: ColorMode): Theme => {
	if (mode === 'light') return theme;
	const { palette } = createTheme({
		palette: {
			mode: 'dark',
			primary: { main: '#9fc9ff', contrastText: '#121722' },
			secondary: { main: '#d1acf4' },
			background: { default: '#121722', paper: '#1b2332' },
			text: { primary: '#eef2f8', secondary: '#c4cedd', disabled: '#a0afc4' },
			divider: '#344157',
			DataGrid: { bg: '#1b2332', headerBg: '#222c3d', pinnedBg: '#1b2332' },
			success: { main: '#83dfb2' },
			error: { main: '#fda6b6' },
			warning: { main: '#f6cc7a' },
			info: { main: '#9fc9ff' },
		},
	});
	return createTheme({
		...theme,
		palette,
		components: {
			...theme.components,
			MuiOutlinedInput: {
				...theme.components?.MuiOutlinedInput,
				styleOverrides: {
					...theme.components?.MuiOutlinedInput?.styleOverrides,
					root: [theme.components?.MuiOutlinedInput?.styleOverrides?.root, { backgroundColor: '#222c3d' }],
				},
			},
			MuiPaper: {
				...theme.components?.MuiPaper,
				styleOverrides: {
					...theme.components?.MuiPaper?.styleOverrides,
					root: [theme.components?.MuiPaper?.styleOverrides?.root, { backgroundImage: 'none' }],
				},
			},
			MuiAppBar: {
				...theme.components?.MuiAppBar,
				styleOverrides: {
					...theme.components?.MuiAppBar?.styleOverrides,
					root: [
						theme.components?.MuiAppBar?.styleOverrides?.root,
						{ backgroundImage: 'none', backgroundColor: '#1b2332' },
					],
				},
			},
			MuiListItemButton: {
				...theme.components?.MuiListItemButton,
				styleOverrides: {
					...theme.components?.MuiListItemButton?.styleOverrides,
					root: [
						theme.components?.MuiListItemButton?.styleOverrides?.root,
						{
							'&.Mui-selected': { backgroundColor: '#2b374a' },
							'&.Mui-selected:hover': { backgroundColor: '#344157' },
						},
					],
				},
			},
		},
	});
};
