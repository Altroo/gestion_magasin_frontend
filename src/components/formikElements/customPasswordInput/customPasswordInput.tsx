import React, { ForwardedRef, forwardRef, useState } from 'react';
import { ThemeProvider, TextField, InputAdornment, IconButton } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

type Props = {
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
	startIcon?: React.ReactNode;
	onClick?: () => void;
};

const CustomPasswordInput = forwardRef<HTMLInputElement, Props>((props: Props, ref: ForwardedRef<HTMLInputElement>) => {
	const { cssClass, theme, startIcon, ...restOfProps } = props;
	const [showpassword, setshowpassword] = useState<boolean>(false);
	const { t } = useLanguage();

	const handleClickShowPassword = () => {
		setshowpassword((prevState) => !prevState);
	};

	return (
		<ThemeProvider theme={theme}>
			<TextField
				ref={ref}
				{...restOfProps}
				type={showpassword ? 'text' : 'password'}
				id={props.id}
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
				slotProps={{
					input: {
						startAdornment: startIcon ? <InputAdornment position="start">{startIcon}</InputAdornment> : undefined,
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									aria-label={t.common.togglePasswordVisibility}
									onClick={handleClickShowPassword}
									onMouseDown={(e) => e.preventDefault()}
									edge="end"
								>
									{showpassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</IconButton>
							</InputAdornment>
						),
					},
				}}
			/>
		</ThemeProvider>
	);
});

CustomPasswordInput.displayName = 'CustomPasswordInput';

export default CustomPasswordInput;
