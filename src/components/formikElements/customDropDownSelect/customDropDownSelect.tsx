import React from 'react';
import Styles from './customDropDownSelect.module.sass';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import {
	ThemeProvider,
	MenuItem,
	FormControl,
	InputLabel,
	OutlinedInput,
	Stack,
	FormHelperText,
	InputAdornment,
} from '@mui/material';
import type { MenuProps as MuiMenuProps } from '@mui/material/Menu';
import type { Theme } from '@mui/material/styles';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { DropDownType } from '@/types/accountTypes';
import { useLanguage } from '@/utils/hooks';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const selectMenuProps: Partial<MuiMenuProps> = {
	slotProps: {
		paper: {
			style: {
				maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
				width: 250,
			},
		},
	},
};

type Props = {
	id: string;
	label: string;
	items: Array<DropDownType> | Array<string>;
	theme: Theme;
	value: string | null;
	size?: 'small' | 'medium';
	onChange?: (event: SelectChangeEvent) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	helperText?: string;
	error?: boolean;
	disabled?: boolean;
	cssClass?: string;
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
	children?: React.ReactNode;
};

const CustomDropDownSelect: React.FC<Props> = (props: Props) => {
	const { t } = useLanguage();
	return (
		<ThemeProvider theme={props.theme}>
			<FormControl className={`${Styles.formControl} ${props.cssClass}`} disabled={props.disabled} error={props.error}>
				<InputLabel id={`${props.id}-label`}>{props.label}</InputLabel>
				<Select
					labelId={`${props.id}-label`}
					id={props.id}
					value={props.value ? props.value : ''}
					size={props.size ? props.size : undefined}
					onChange={props.onChange}
					input={
						<OutlinedInput
							label={props.label}
							startAdornment={
								props.startIcon ? <InputAdornment position="start">{props.startIcon}</InputAdornment> : undefined
							}
							endAdornment={props.endIcon ? <InputAdornment position="end">{props.endIcon}</InputAdornment> : undefined}
						/>
					}
					MenuProps={selectMenuProps}
					renderValue={(selected) => selected}
					onBlur={props.onBlur}
					error={props.error}
				>
					{props.items.map((item, index) => {
						const isObject = typeof item === 'object' && item !== null && 'value' in item;
						const value = isObject ? item?.value : item;
						return (
							<MenuItem key={index} value={value} sx={{ minHeight: ITEM_HEIGHT }}>
								<Stack
									direction="row"
									sx={{
										justifyContent: 'space-between',
										width: '100%',
									}}
								>
									<span>{value || t.common.selectValue}</span>
									{props.value === value && <CheckCircleIcon sx={{ fontSize: 20 }} color="primary" />}
								</Stack>
							</MenuItem>
						);
					})}
				</Select>
				{props.helperText ? (
					<FormHelperText sx={{ color: 'rgb(229, 115, 115)' }}>{props.helperText}</FormHelperText>
				) : null}
			</FormControl>
		</ThemeProvider>
	);
};

export default CustomDropDownSelect;
