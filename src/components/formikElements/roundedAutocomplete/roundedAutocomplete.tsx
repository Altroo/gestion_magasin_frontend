import type { ReactNode } from 'react';
import { Autocomplete, InputAdornment, TextField, ThemeProvider } from '@mui/material';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import { splitAutocompleteRenderParams } from '@/utils/muiAutocompleteSlots';
import { customDropdownTheme } from '@/utils/themes';

type RoundedAutocompleteProps<T> = Omit<AutocompleteProps<T, false, false, false>, 'renderInput'> & {
	label?: string;
	placeholder?: string;
	error?: boolean;
	helperText?: ReactNode;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	textFieldProps?: Omit<TextFieldProps, 'label' | 'placeholder' | 'error' | 'helperText'>;
	theme?: Theme;
};

const RoundedAutocomplete = <T,>({
	label,
	placeholder,
	error,
	helperText,
	startIcon,
	endIcon,
	textFieldProps,
	theme,
	...autocompleteProps
}: RoundedAutocompleteProps<T>) => {
	const appliedTheme = theme ?? customDropdownTheme();
	const size = autocompleteProps.size ?? 'small';
	const fullWidth = autocompleteProps.fullWidth ?? true;

	return (
		<ThemeProvider theme={appliedTheme}>
			<Autocomplete<T, false, false, false>
				{...autocompleteProps}
				size={size}
				fullWidth={fullWidth}
				renderInput={(params) => {
					const { textFieldParams, inputSlot, htmlInputSlot } = splitAutocompleteRenderParams(params);
					const { slotProps, ...restTextFieldProps } = textFieldProps ?? {};
					const inputSlotProps = slotProps?.input && typeof slotProps.input === 'object' ? slotProps.input : {};
					const htmlInputSlotProps = slotProps?.htmlInput && typeof slotProps.htmlInput === 'object' ? slotProps.htmlInput : {};

					return (
						<TextField
							{...textFieldParams}
							{...restTextFieldProps}
							label={label}
							placeholder={placeholder}
							error={error}
							helperText={helperText}
							slotProps={{
								...slotProps,
								input: {
									...inputSlot,
									...inputSlotProps,
									startAdornment: (
										<>
											{startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>}
											{'startAdornment' in inputSlot ? inputSlot.startAdornment : null}
											{'startAdornment' in inputSlotProps ? inputSlotProps.startAdornment : null}
										</>
									),
									endAdornment: (
										<>
											{'endAdornment' in inputSlot ? inputSlot.endAdornment : null}
											{endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
											{'endAdornment' in inputSlotProps ? inputSlotProps.endAdornment : null}
										</>
									),
								},
								htmlInput: {
									...htmlInputSlot,
									...htmlInputSlotProps,
								},
							}}
						/>
					);
				}}
			/>
		</ThemeProvider>
	);
};

export default RoundedAutocomplete;
