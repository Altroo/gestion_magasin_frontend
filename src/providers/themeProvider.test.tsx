import { fireEvent, render, screen } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import ThemeProvider, { useColorMode } from './themeProvider';
import { ThemeProvider as ScopedThemeProvider } from './scopedThemeProvider';
import { textInputTheme } from '@/utils/themes';
import { resolveColorMode } from '@/utils/colorMode';

const Probe = () => {
	const theme = useTheme();
	const { toggleTheme } = useColorMode();
	return (
		<>
			<button onClick={toggleTheme}>Toggle</button>
			<output>
				{theme.palette.mode} {theme.typography.fontFamily}
			</output>
			<input aria-label="Unfinished work" />
		</>
	);
};
afterEach(() => {
	document.cookie = 'app-theme=;path=/;max-age=0';
	delete document.documentElement.dataset.theme;
});
it('starts in the server-selected mode, including nested form themes', () => {
	render(
		<ThemeProvider initialTheme="dark">
			<ScopedThemeProvider theme={textInputTheme()}>
				<Probe />
			</ScopedThemeProvider>
		</ThemeProvider>,
	);
	expect(screen.getByText('dark Poppins')).toBeVisible();
	expect(document.documentElement.dataset.theme).toBe('dark');
	expect(document.cookie).toContain('app-theme=dark');
});
it('switches nested themes and remembers the preference without losing unfinished input', () => {
	render(
		<ThemeProvider>
			<ScopedThemeProvider theme={textInputTheme()}>
				<Probe />
			</ScopedThemeProvider>
		</ThemeProvider>,
	);
	const input = screen.getByLabelText('Unfinished work');
	fireEvent.change(input, { target: { value: 'Unsaved invoice' } });
	fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
	expect(screen.getByText('dark Poppins')).toBeVisible();
	expect(input).toHaveValue('Unsaved invoice');
	expect(document.cookie).toContain('app-theme=dark');
	fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
	expect(screen.getByText('light Poppins')).toBeVisible();
	expect(document.documentElement.dataset.theme).toBe('light');
	expect(document.cookie).toContain('app-theme=light');
});
it('treats missing or invalid cookie values as light', () => {
	expect(resolveColorMode(undefined)).toBe('light');
	expect(resolveColorMode('invalid')).toBe('light');
	expect(resolveColorMode('dark')).toBe('dark');
});
