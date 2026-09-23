import {
	type ChangeEvent,
	type FocusEvent,
	type HTMLInputTypeAttribute,
	type KeyboardEventHandler,
	type ReactNode,
	type Ref,
} from 'react';
import type { Theme } from '@mui/material/styles';
import { InputAdornment, ThemeProvider } from '@mui/material';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Props = {
	type: HTMLInputTypeAttribute;
	id: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	theme: Theme;
	onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
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
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	slotProps?: TextFieldProps['slotProps'];
	sx?: TextFieldProps['sx'];
	name?: string;
	required?: boolean;
	autoComplete?: string;
	autoFocus?: boolean;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	maxLength?: number;
	shrink?: boolean;
	multiline?: boolean;
	rows?: number;
	inputRef?: Ref<HTMLInputElement>;
};

const CustomTextInput = ({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) => {
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
				multiline={props.type === 'textarea' || multiline}
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
};

CustomTextInput.displayName = 'CustomTextInput';
export default CustomTextInput;
