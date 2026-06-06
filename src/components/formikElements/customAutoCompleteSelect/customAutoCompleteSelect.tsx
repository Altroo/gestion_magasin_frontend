import React, { type Key } from 'react';
import type { TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';
import type { DropDownType } from '@/types/accountTypes';
import { Box, Typography } from '@mui/material';
import RoundedAutocomplete from '@/components/formikElements/roundedAutocomplete/roundedAutocomplete';

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
		<RoundedAutocomplete
			id={id}
			size={size}
			fullWidth={fullWidth}
			noOptionsText={noOptionsText}
			options={items}
			getOptionLabel={(option) => option.value}
			getOptionKey={(option) => option.code || option.value}
			filterOptions={(options, state) =>
				options.filter((option) => option.value.toLowerCase().includes(state.inputValue.toLowerCase()))
			}
			value={value}
			onChange={onChange}
			disabled={disabled}
			isOptionEqualToValue={(option, val) => option.code === val.code}
			onBlur={onBlur}
			renderOption={(props, option) =>
				(renderOptionProp || defaultRenderOption)(props as React.HTMLAttributes<HTMLLIElement> & { key: Key }, option)
			}
			label={label}
			error={error}
			helperText={helperText}
			startIcon={startIcon}
			endIcon={endIcon}
			textFieldProps={{ slotProps }}
			theme={theme}
		/>
	);
};

export default CustomAutoCompleteSelect;
