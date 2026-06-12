import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

const inputSlotKey = "InputProps";
const htmlInputSlotKey = "inputProps";

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

	const textFieldParams = { ...source };
	delete textFieldParams[inputSlotKey];
	delete textFieldParams[htmlInputSlotKey];

	return {
		textFieldParams,
		inputSlot,
		htmlInputSlot,
	};
};
