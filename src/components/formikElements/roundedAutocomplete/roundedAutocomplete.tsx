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
					const inputStartAdornment = inputSlot.startAdornment as ReactNode;
					const customStartAdornment = inputSlotProps.startAdornment as ReactNode;
					const inputEndAdornment = inputSlot.endAdornment as ReactNode;
					const customEndAdornment = inputSlotProps.endAdornment as ReactNode;
					const startAdornment =
						startIcon || inputStartAdornment || customStartAdornment ? (
							<>
								{startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined}
								{inputStartAdornment}
								{customStartAdornment}
							</>
						) : undefined;
					const endAdornment =
						inputEndAdornment || endIcon || customEndAdornment ? (
							<>
								{inputEndAdornment}
								{endIcon ? <InputAdornment position="end">{endIcon}</InputAdornment> : undefined}
								{customEndAdornment}
							</>
						) : undefined;

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
									startAdornment,
									endAdornment,
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
