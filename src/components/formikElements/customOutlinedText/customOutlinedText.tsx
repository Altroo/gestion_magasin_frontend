import React, { forwardRef } from 'react';
import { ThemeProvider } from '@mui/material';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { Theme } from '@mui/material/styles';

type Props = {
	type: React.HTMLInputTypeAttribute;
	id: string;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onInput?: (e: React.InputEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
	theme: Theme;
	cssClass?: string;
	helperText?: string;
	error?: boolean;
	placeholder?: string;
	label?: string;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	disabled?: boolean;
	onClick?: () => void;
	autoFocus?: boolean;
	slotProps?: TextFieldProps['slotProps'] & { htmlInput?: React.InputHTMLAttributes<HTMLInputElement> };
	inputRef?: React.Ref<HTMLInputElement | null>;
};

const CustomOutlinedText = forwardRef<HTMLInputElement, Props>((props, ref) => {
	const {
		cssClass,
		theme,
		slotProps,
		inputRef,
		value,
		onChange,
		onInput,
		onBlur,
		onKeyDown,
		onPaste,
		type,
		id,
		helperText,
		error,
		placeholder,
		label,
		fullWidth,
		size,
		disabled,
		onClick,
		autoFocus,
		...rest
	} = props;

	// Merge parent-provided slotProps.htmlInput with explicit handlers (do not override parent's handlers)
	const mergedHtmlInput: React.InputHTMLAttributes<HTMLInputElement> = {
		...(slotProps?.htmlInput ?? {}),
		onChange: slotProps?.htmlInput?.onChange ?? onChange,
		onInput: slotProps?.htmlInput?.onInput ?? onInput,
		onBlur: slotProps?.htmlInput?.onBlur ?? onBlur,
		onKeyDown: slotProps?.htmlInput?.onKeyDown ?? onKeyDown,
		onPaste: slotProps?.htmlInput?.onPaste ?? onPaste,
		// preserve other htmlInput props like maxLength if provided by parent
		...(slotProps?.htmlInput ?? {}),
	};

	return (
		<ThemeProvider theme={theme}>
			<TextField
				{...rest}
				type={type}
				id={id}
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				helperText={helperText}
				error={error}
				placeholder={placeholder}
				label={label}
				fullWidth={fullWidth}
				size={size}
				disabled={disabled}
				onClick={onClick}
				autoFocus={autoFocus}
				inputRef={inputRef ?? (ref as React.Ref<HTMLInputElement | null>)}
				variant="outlined"
				slotProps={{
					...(slotProps ?? {}),
					htmlInput: mergedHtmlInput,
				}}
				className={cssClass}
			/>
		</ThemeProvider>
	);
});

CustomOutlinedText.displayName = 'CustomOutlinedText';
export default CustomOutlinedText;
