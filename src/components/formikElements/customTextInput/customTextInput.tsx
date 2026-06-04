import React, { ForwardedRef, forwardRef } from 'react';
import type { Theme } from '@mui/material/styles';
import { InputAdornment, ThemeProvider } from '@mui/material';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Props = {
	type: React.HTMLInputTypeAttribute;
	id: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	variant?: 'filled' | 'standard' | 'outlined';
	onClick?: () => void;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	name?: string;
	required?: boolean;
	autoComplete?: string;
	autoFocus?: boolean;
	onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
	maxLength?: number;
	shrink?: boolean;
	multiline?: boolean;
	rows?: number;
};

const CustomTextInput = forwardRef<HTMLInputElement, Props>((props: Props, ref: ForwardedRef<HTMLInputElement>) => {
	const { cssClass, theme, startIcon, endIcon, maxLength, shrink, multiline, rows, ...restOfProps } = props;

	return (
		<ThemeProvider theme={theme}>
			<TextField
				{...restOfProps}
				ref={ref}
				variant={props.variant}
				type={props.type}
				id={props.id}
				name={props.name || props.id}
				value={props.value}
				onChange={props.onChange}
				onBlur={props.onBlur}
				helperText={props.helperText}
				error={props.error}
				placeholder={props.placeholder}
				label={props.label}
				fullWidth={props.fullWidth}
				className={cssClass}
				size={props.size}
				onClick={props.onClick}
				color="primary"
				disabled={props.disabled}
				required={props.required}
				autoComplete={props.autoComplete}
				multiline={multiline}
				rows={rows}
				slotProps={{
					...props.slotProps,
					inputLabel: {
						...props.slotProps?.inputLabel,
						...(shrink ? { shrink: true } : {}),
					},
					input: {
						...props.slotProps?.input,
						startAdornment: startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined,
						endAdornment: endIcon ? <InputAdornment position="end">{endIcon}</InputAdornment> : undefined,
					},
					htmlInput: {
						...props.slotProps?.htmlInput,
						...(maxLength ? { maxLength } : {}),
					},
				}}
			/>
		</ThemeProvider>
	);
});

CustomTextInput.displayName = 'CustomTextInput';
export default CustomTextInput;
