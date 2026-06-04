import { getDefaultTheme, navigationBarTheme, CustomTheme, textInputTheme, customDropdownTheme } from './themes';

describe('getDefaultTheme', () => {
	it('returns a MUI theme object', () => {
		const theme = getDefaultTheme();
		expect(theme).toBeDefined();
		expect(typeof theme.palette).toBe('object');
	});

	it('sets primary colour based on default blue #0274D7', () => {
		const theme = getDefaultTheme();
		// CustomTheme applies hexToRGB so primary.main will be an rgba string
		expect(theme.palette.primary.main).toContain('rgba');
	});

	it('sets custom breakpoint md to 992', () => {
		const theme = getDefaultTheme();
		expect(theme.breakpoints.values.md).toBe(992);
	});
});

describe('navigationBarTheme', () => {
	it('returns a MUI theme object', () => {
		const theme = navigationBarTheme();
		expect(theme).toBeDefined();
		expect(typeof theme.palette).toBe('object');
	});

	it('inherits primary colour from getDefaultTheme', () => {
		const theme = navigationBarTheme();
		expect(theme.palette.primary.main).toContain('rgba');
	});

	it('accepts an optional primary colour without throwing', () => {
		expect(() => navigationBarTheme('#ff0000')).not.toThrow();
	});
});

describe('CustomTheme', () => {
	it('returns a MUI theme object', () => {
		const theme = CustomTheme();
		expect(theme).toBeDefined();
		expect(typeof theme.palette).toBe('object');
	});

	it('returns a theme when given a hex primary colour', () => {
		const theme = CustomTheme('#3a86ff');
		expect(theme).toBeDefined();
	});

	it('returns a theme when given white (#FFFFFF)', () => {
		const theme = CustomTheme('#FFFFFF');
		expect(theme).toBeDefined();
	});

	it('returns a theme with no primary colour argument', () => {
		const theme = CustomTheme(undefined);
		expect(theme).toBeDefined();
	});
});

describe('textInputTheme', () => {
	it('returns a MUI theme object', () => {
		const theme = textInputTheme();
		expect(theme).toBeDefined();
		expect(typeof theme.palette).toBe('object');
	});
});

describe('customDropdownTheme', () => {
	it('returns a MUI theme object', () => {
		const theme = customDropdownTheme();
		expect(theme).toBeDefined();
		expect(typeof theme.palette).toBe('object');
	});
});
