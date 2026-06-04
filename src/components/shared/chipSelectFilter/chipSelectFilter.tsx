'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import { chipSelectFilterTheme } from '@/utils/themes';
import { useLanguage } from '@/utils/hooks';

export interface ChipSelectOption {
	id: string;
	nom: string;
}

export interface ChipSelectFilterProps {
	label: string;
	options: ChipSelectOption[];
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	placeholder?: string;
	theme?: Theme;
}

const ChipSelectFilter: React.FC<ChipSelectFilterProps> = ({
	label,
	options,
	selectedIds,
	onChange,
	placeholder,
	theme,
}) => {
	const [inputValue, setInputValue] = useState('');
	const { t } = useLanguage();

	const appliedTheme = useMemo(() => theme ?? chipSelectFilterTheme(), [theme]);

	const selectedOptions = useMemo(() => options.filter((option) => selectedIds.includes(option.id)), [options, selectedIds]);

	const handleChange = useCallback(
		(_event: React.SyntheticEvent, newValue: ChipSelectOption[]) => {
			onChange(newValue.map((option) => option.id));
		},
		[onChange],
	);

	const handleInputChange = useCallback((_event: React.SyntheticEvent, newInputValue: string) => {
		setInputValue(newInputValue);
	}, []);

	return (
		<ThemeProvider theme={appliedTheme}>
			<Box sx={{ width: '100%' }}>
				<Typography
					variant="caption"
					sx={{
						color: 'text.secondary',
						mb: 0.5,
						display: 'block',
						fontFamily: 'Poppins',
						fontSize: '12px',
					}}
				>
					{label}
				</Typography>
				<Autocomplete
					multiple
					size="small"
					options={options}
					value={selectedOptions}
					onChange={handleChange}
					inputValue={inputValue}
					onInputChange={handleInputChange}
					getOptionLabel={(option) => option.nom}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					renderValue={(selected, getTagProps) =>
						selected.map((option, index) => {
							const { key, ...rest } = getTagProps({ index });
							return <Chip key={key} label={option.nom} size="small" variant="outlined" color="primary" {...rest} />;
						})
					}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder={selectedOptions.length === 0 ? (placeholder ?? `Filtrer par ${label.toLowerCase()}`) : ''}
							variant="outlined"
							size="small"
						/>
					)}
					noOptionsText={t.common.noOptions}
				/>
			</Box>
		</ThemeProvider>
	);
};

export default ChipSelectFilter;
