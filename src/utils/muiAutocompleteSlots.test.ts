import { splitAutocompleteRenderParams } from './muiAutocompleteSlots';

describe('splitAutocompleteRenderParams', () => {
	it('returns safe empty slot objects when autocomplete params do not include legacy props', () => {
		const result = splitAutocompleteRenderParams({
			id: 'article',
			disabled: false,
			fullWidth: true,
			size: 'small',
			InputLabelProps: {},
			slotProps: {},
		} as never);

		expect(result.inputSlot).toEqual({});
		expect(result.htmlInputSlot).toEqual({});
	});

	it('reads MUI v9 slotProps input and htmlInput values', () => {
		const result = splitAutocompleteRenderParams({
			slotProps: {
				input: { startAdornment: 'start' },
				htmlInput: { 'aria-label': 'Article' },
			},
		} as never);

		expect(result.inputSlot).toEqual({ startAdornment: 'start' });
		expect(result.htmlInputSlot).toEqual({ 'aria-label': 'Article' });
	});
});
