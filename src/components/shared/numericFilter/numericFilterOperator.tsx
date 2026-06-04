'use client';

import React from 'react';
import { TextField } from '@mui/material';
import { GridFilterInputValueProps, GridFilterItem, GridFilterOperator } from '@mui/x-data-grid';
import { useLanguage } from '@/utils/hooks';

const parseNumeric = (value: number | string | null | undefined): number | null => {
	if (value == null || value === '') {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const NumericFilterInput: React.FC<GridFilterInputValueProps> = ({ item, applyValue }) => {
	const { t } = useLanguage();

	return (
		<TextField
			value={item.value ?? ''}
			onChange={(event) => applyValue({ ...item, value: event.target.value })}
			size="small"
			type="number"
			placeholder={t.common.value}
			sx={{ width: 140 }}
		/>
	);
};

export const createNumericFilterOperators = <T extends Record<string, unknown>>(): GridFilterOperator<
	T,
	number | string,
	string
>[] => [
	{
		label: '=',
		value: 'numEquals',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue === filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
	{
		label: '!=',
		value: 'numNotEquals',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue !== filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
	{
		label: '>',
		value: 'numGreaterThan',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue > filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
	{
		label: '>=',
		value: 'numGreaterThanOrEqual',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue >= filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
	{
		label: '<',
		value: 'numLessThan',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue < filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
	{
		label: '<=',
		value: 'numLessThanOrEqual',
		getApplyFilterFn: (filterItem: GridFilterItem) => {
			const filterValue = parseNumeric(filterItem.value);
			if (filterValue === null) return null;
			return (value: number | string | null | undefined) => {
				const cellValue = parseNumeric(value);
				return cellValue !== null && cellValue <= filterValue;
			};
		},
		InputComponent: NumericFilterInput,
	},
];

export default NumericFilterInput;
