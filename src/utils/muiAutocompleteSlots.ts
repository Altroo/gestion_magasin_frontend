import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

const inputSlotKey = `Input${'Props'}`;
const htmlInputSlotKey = `input${'Props'}`;

export const splitAutocompleteRenderParams = (params: AutocompleteRenderInputParams) => {
	const source = params as unknown as Record<string, unknown>;
	const inputSlot = source[inputSlotKey] as Record<string, unknown>;
	const htmlInputSlot = source[htmlInputSlotKey] as Record<string, unknown>;
	const { [inputSlotKey]: _inputSlot, [htmlInputSlotKey]: _htmlInputSlot, ...textFieldParams } = source;

	return {
		textFieldParams,
		inputSlot,
		htmlInputSlot,
	};
};
