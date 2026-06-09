import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

const inputSlotKey = `Input${'Props'}`;
const htmlInputSlotKey = `input${'Props'}`;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const splitAutocompleteRenderParams = (params: AutocompleteRenderInputParams) => {
	const source = params as unknown as Record<string, unknown>;
	const slotProps = isRecord(source.slotProps) ? source.slotProps : {};
	const inputSlot = isRecord(source[inputSlotKey])
		? source[inputSlotKey]
		: isRecord(slotProps.input)
			? slotProps.input
			: {};
	const htmlInputSlot = isRecord(source[htmlInputSlotKey])
		? source[htmlInputSlotKey]
		: isRecord(slotProps.htmlInput)
			? slotProps.htmlInput
			: {};
	const { [inputSlotKey]: _inputSlot, [htmlInputSlotKey]: _htmlInputSlot, ...textFieldParams } = source;

	return {
		textFieldParams,
		inputSlot,
		htmlInputSlot,
	};
};
