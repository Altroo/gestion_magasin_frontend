'use client';

import React from 'react';
import { InputAdornment, TextFieldProps } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { fr } from 'date-fns/locale';
import { formatLocalDate } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';

type PickerFieldProps = {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: TextFieldProps['onBlur'];
	error?: boolean;
	helperText?: React.ReactNode;
	fullWidth?: boolean;
	size?: 'small' | 'medium';
	startIcon?: React.ReactNode;
};

const inputTheme = textInputTheme();

const fieldRadius = '16px';

const pickerTextFieldSx = {
	'& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': {
		borderRadius: fieldRadius,
		minHeight: 40,
		fontFamily: 'Poppins',
		fontSize: '16px',
	},
	'& .MuiPickersOutlinedInput-root': {
		overflow: 'hidden',
	},
	'& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline': {
		borderRadius: fieldRadius,
		borderColor: '#A3A3AD',
	},
	'&:hover .MuiOutlinedInput-notchedOutline, &:hover .MuiPickersOutlinedInput-notchedOutline': {
		borderColor: '#0274d7',
	},
	'& .Mui-focused .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
		borderColor: '#0274d7',
	},
	'& .MuiInputBase-root': {
		borderRadius: '16px',
		minHeight: 40,
		fontFamily: 'Poppins',
		fontSize: '16px',
	},
	'& .MuiInputBase-input, & .MuiPickersSectionList-root': {
		fontFamily: 'Poppins',
		fontSize: '16px',
	},
	'& .MuiInputLabel-root': {
		fontFamily: 'Poppins',
		fontSize: '16px',
	},
};

const pickerPaperSx = {
	borderRadius: 2,
	overflow: 'hidden',
	border: '1px solid #E5E7EB',
	boxShadow: '0 8px 24px rgba(13, 7, 11, 0.16)',
	'& .MuiPickersLayout-root': {
		fontFamily: 'Poppins',
	},
	'& .MuiMenuItem-root': {
		fontFamily: 'Poppins',
		fontSize: '15px',
		minHeight: 34,
		borderRadius: 1,
		mx: 0.5,
	},
	'& .MuiMenuItem-root.Mui-selected': {
		backgroundColor: '#0274d7',
		color: '#FFFFFF',
	},
	'& .MuiMenuItem-root.Mui-selected:hover': {
		backgroundColor: '#0264ba',
	},
};

const parseDateValue = (value?: string | null): Date | null => {
	if (!value) return null;
	const [year, month, day] = value.split('-').map(Number);
	if (!year || !month || !day) return null;
	const date = new Date(year, month - 1, day);
	return Number.isNaN(date.getTime()) ? null : date;
};

const parseTimeValue = (value?: string | null): Date | null => {
	if (!value) return null;
	const [hours, minutes] = value.split(':').map(Number);
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);
	return Number.isNaN(date.getTime()) ? null : date;
};

const formatTimeValue = (date: Date | null): string => {
	if (!date || Number.isNaN(date.getTime())) return '';
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const textFieldSlotProps = ({ id, onBlur, error, helperText, fullWidth, size, startIcon }: PickerFieldProps) => ({
	id,
	onBlur,
	error,
	helperText,
	fullWidth,
	size: size ?? 'small',
	variant: 'outlined' as const,
	sx: pickerTextFieldSx,
	InputProps: startIcon
		? {
				startAdornment: <InputAdornment position="start">{startIcon}</InputAdornment>,
			}
		: undefined,
});

export const MuiFormikDatePicker = (props: PickerFieldProps) => (
	<ThemeProvider theme={inputTheme}>
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<DatePicker
				label={props.label}
				format="dd/MM/yyyy"
				value={parseDateValue(props.value)}
				onChange={(date) => props.onChange(date ? formatLocalDate(date) : '')}
				slotProps={{
					textField: textFieldSlotProps(props),
					desktopPaper: { sx: pickerPaperSx },
				}}
			/>
		</LocalizationProvider>
	</ThemeProvider>
);

export const MuiFormikTimePicker = (props: PickerFieldProps) => {
	const commonProps = {
		ampm: false,
		format: 'HH:mm',
		label: props.label,
		value: parseTimeValue(props.value),
		onChange: (date: Date | null) => props.onChange(formatTimeValue(date)),
	};

	const fieldSlotProps = textFieldSlotProps(props);

	return (
		<ThemeProvider theme={inputTheme}>
			<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
				<DesktopTimePicker
					{...commonProps}
					viewRenderers={{
						hours: renderTimeViewClock,
						minutes: renderTimeViewClock,
					}}
					slotProps={{
						textField: fieldSlotProps,
						desktopPaper: { sx: pickerPaperSx },
					}}
				/>
			</LocalizationProvider>
		</ThemeProvider>
	);
};
