import React, { type Key } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import { Autocomplete, Box, InputAdornment, Typography } from '@mui/material';

type Props = {
	id: string;
	label: string;
	items: Array<DropDownType>;
	theme: Theme;
	value: DropDownType | null;
	noOptionsText: string;
	size?: 'small' | 'medium';
	fullWidth?: boolean;
	onChange?: (event: React.SyntheticEvent, newValue: DropDownType | null) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	renderOption?: (props: React.HTMLAttributes<HTMLLIElement> & { key: Key }, option: DropDownType) => React.ReactNode;
};

const CustomAutoCompleteSelect: React.FC<Props> = ({
	id,
	label,
	items,
	theme,
	value,
	fullWidth,
	onChange,
	disabled,
	slotProps,
	startIcon,
	endIcon,
	noOptionsText,
	size,
	onBlur,
	error,
	helperText,
	renderOption: renderOptionProp,
}) => {
	const defaultRenderOption = (props: React.HTMLAttributes<HTMLLIElement> & { key: Key }, option: DropDownType) => {
		const { key, ...rest } = props;
		return (
			<Box component="li" key={key} {...rest}>
				<Typography variant="body2" noWrap sx={{ flex: 1 }}>
					{option.value}
				</Typography>
			</Box>
		);
	};

	return (
		<ThemeProvider theme={theme}>
			<Autocomplete
				id={id}
				size={size}
				fullWidth={fullWidth}
				noOptionsText={noOptionsText}
				options={items}
				getOptionLabel={(option) => option.value}
				getOptionKey={(option) => option.value}
				filterOptions={(options, state) =>
					options.filter((option) => option.value.toLowerCase().includes(state.inputValue.toLowerCase()))
				}
				value={value}
				onChange={onChange}
				disabled={disabled}
				isOptionEqualToValue={(option, val) => option.value === val.value}
				onBlur={onBlur}
				renderOption={(props, option) =>
					(renderOptionProp || defaultRenderOption)(props as React.HTMLAttributes<HTMLLIElement> & { key: Key }, option)
				}
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						error={error}
						helperText={helperText}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: '12px',
							},
						}}
						InputProps={{
							...params.InputProps,
							startAdornment: (
								<>
									{startIcon && <InputAdornment position="start">{startIcon}</InputAdornment>}
									{params.InputProps.startAdornment}
								</>
							),
							endAdornment: (
								<>
									{params.InputProps.endAdornment}
									{endIcon && <InputAdornment position="end">{endIcon}</InputAdornment>}
								</>
							),
						}}
						slotProps={slotProps}
					/>
				)}
			/>
		</ThemeProvider>
	);
};

export default CustomAutoCompleteSelect;
