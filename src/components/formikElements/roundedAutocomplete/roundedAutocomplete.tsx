import type { ReactNode } from 'react';
import { Autocomplete, InputAdornment, TextField, ThemeProvider } from '@mui/material';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
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
				renderInput={(params) => (
					<TextField
						{...params}
						{...textFieldProps}
						label={label}
						placeholder={placeholder}
						error={error}
						helperText={helperText}
						InputProps={{
							...params.InputProps,
							...textFieldProps?.InputProps,
							startAdornment: (
								<>
									{startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>}
									{params.InputProps.startAdornment}
									{textFieldProps?.InputProps?.startAdornment}
								</>
							),
							endAdornment: (
								<>
									{params.InputProps.endAdornment}
									{endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
									{textFieldProps?.InputProps?.endAdornment}
								</>
							),
						}}
					/>
				)}
			/>
		</ThemeProvider>
	);
};

export default RoundedAutocomplete;
