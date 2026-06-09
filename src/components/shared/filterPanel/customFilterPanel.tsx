'use client';

import React from 'react';
import { Box, Button, FormControl, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import { GridLogicOperator } from '@mui/x-data-grid';
import { useLanguage } from '@/utils/hooks';
import type { TranslationDictionary } from '@/types/languageTypes';

export interface DateRangeFilterValue {
	from?: string;
	to?: string;
}

export type CustomFilterValue = string | DateRangeFilterValue;

export interface CustomFilterItem {
	id: string;
	field: string;
	operator: string;
	value: CustomFilterValue;
}

export interface CustomFilterModel {
	items: CustomFilterItem[];
	logicOperator: GridLogicOperator;
}

interface CustomFilterPanelProps {
	columns: GridColDef[];
	filterModel: CustomFilterModel;
	onChange: (model: CustomFilterModel) => void;
}

interface FilterValueFieldProps {
	item: CustomFilterItem;
	applyValue: (item: CustomFilterItem) => void;
}

interface OperatorInfo {
	value: string;
	label: string;
	InputComponent?: React.ComponentType<FilterValueFieldProps>;
}

/** Operators that don't require a value input */
const VALUE_LESS_OPERATORS = new Set(['isEmpty', 'isNotEmpty']);

// Default text operators (translated)
const getDefaultTextOperators = (t: TranslationDictionary): OperatorInfo[] => [
	{ value: 'contains', label: t.filters.contains },
	{ value: 'equals', label: t.filters.equals },
	{ value: 'startsWith', label: t.filters.startsWith },
	{ value: 'endsWith', label: t.filters.endsWith },
	{ value: 'isEmpty', label: t.filters.isEmpty },
	{ value: 'isNotEmpty', label: t.filters.isNotEmpty },
];

/** Check if a filter item has a meaningful value */
export function filterHasValue(item: CustomFilterItem): boolean {
	if (VALUE_LESS_OPERATORS.has(item.operator)) return true;
	if (typeof item.value === 'string') return item.value.trim() !== '';
	if (typeof item.value === 'object' && item.value !== null) {
		const range = item.value;
		return !!(range.from || range.to);
	}
	return false;
}

// Simple text input for text-based filters
const TextFilterInput: React.FC<FilterValueFieldProps> = ({ item, applyValue }) => {
	const { t } = useLanguage();
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		applyValue({ ...item, value: event.target.value });
	};

	if (VALUE_LESS_OPERATORS.has(item.operator)) {
		return null;
	}

	const currentValue = typeof item.value === 'string' ? item.value : '';

	return (
		<TextField
			size="small"
			value={currentValue}
			onChange={handleChange}
			placeholder={t.common.value}
			sx={{ minWidth: 200 }}
		/>
	);
};

// Extract operators from column definition
function extractOperators(col: GridColDef, t: TranslationDictionary): OperatorInfo[] {
	if (col.filterOperators && col.filterOperators.length > 0) {
		return col.filterOperators.map((op) => ({
			value: op.value,
			label: op.label ?? op.value,
			InputComponent: op.InputComponent as React.ComponentType<FilterValueFieldProps> | undefined,
		}));
	}
	return getDefaultTextOperators(t);
}

const CustomFilterPanel: React.FC<CustomFilterPanelProps> = ({ columns, filterModel, onChange }) => {
	const { t } = useLanguage();
	const filterableColumns = columns.filter((col) => col.field !== 'actions' && col.filterable !== false);

	// Use a ref to track the filter counter for generating IDs
	const filterCounterRef = React.useRef(0);

	const handleAddFilter = () => {
		const firstColumn = filterableColumns[0];
		if (!firstColumn) return;

		const operators = extractOperators(firstColumn, t);
		const defaultOperator = operators[0]?.value ?? 'contains';

		// Generate ID in event handler (not during render)
		filterCounterRef.current += 1;
		const newItem: CustomFilterItem = {
			id: `filter-${filterCounterRef.current}`,
			field: firstColumn.field,
			operator: defaultOperator,
			value: '',
		};
		onChange({
			...filterModel,
			items: [...filterModel.items, newItem],
		});
	};

	const handleRemoveFilter = (id: string) => {
		onChange({
			...filterModel,
			items: filterModel.items.filter((item) => item.id !== id),
		});
	};

	const handleClearAll = () => {
		onChange({
			...filterModel,
			items: [],
		});
	};

	const handleLogicOperatorChange = (logicOperator: GridLogicOperator) => {
		onChange({
			...filterModel,
			logicOperator,
		});
	};

	const handleItemChange = (id: string, updates: Partial<CustomFilterItem>) => {
		onChange({
			...filterModel,
			items: filterModel.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
		});
	};

	const handleColumnChange = (id: string, field: string) => {
		const column = columns.find((col) => col.field === field);
		if (!column) return;

		const operators = extractOperators(column, t);
		const defaultOperator = operators[0]?.value ?? 'contains';

		handleItemChange(id, {
			field,
			operator: defaultOperator,
			value: '',
		});
	};

	const handleOperatorChange = (id: string, operator: string) => {
		const item = filterModel.items.find((i) => i.id === id);
		const wasValueless = item ? VALUE_LESS_OPERATORS.has(item.operator) : false;
		const isValueless = VALUE_LESS_OPERATORS.has(operator);

		if (wasValueless !== isValueless) {
			handleItemChange(id, { operator, value: '' });
		} else {
			handleItemChange(id, { operator });
		}
	};

	const logicLabel = filterModel.logicOperator === GridLogicOperator.And ? t.filters.and : t.filters.or;

	return (
		<Box sx={{ p: 2, minWidth: 600, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
			<Stack spacing={1.5}>
				{filterModel.items.map((item, index) => {
					const column = columns.find((col) => col.field === item.field);
					const operators = column ? extractOperators(column, t) : getDefaultTextOperators(t);
					const currentOperator = operators.find((op) => op.value === item.operator);
					const InputComponent = currentOperator?.InputComponent ?? TextFilterInput;

					return (
						<Stack key={item.id} direction="row" spacing={1} alignItems="center">
							{/* Logic operator column - editable on 2nd row, read-only chip on 3rd+ */}
							<Box sx={{ width: 80, flexShrink: 0 }}>
								{index === 0 ? null : index === 1 ? (
									<FormControl size="small" fullWidth>
										<Select
											value={filterModel.logicOperator}
											onChange={(e) => handleLogicOperatorChange(e.target.value as GridLogicOperator)}
										>
											<MenuItem value={GridLogicOperator.And}>ET</MenuItem>
											<MenuItem value={GridLogicOperator.Or}>OU</MenuItem>
										</Select>
									</FormControl>
								) : (
									<Box
										sx={{
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											border: '1px solid',
											borderColor: 'rgba(0, 0, 0, 0.23)',
											borderRadius: 1,
											py: '8.5px',
											fontSize: 'inherit',
											fontWeight: 'inherit',
											lineHeight: '1.4375em',
											color: 'text.primary',
											fontFamily: 'Poppins',
										}}
									>
										{logicLabel}
									</Box>
								)}
							</Box>

							{/* Column selector */}
							<FormControl size="small" sx={{ minWidth: 150 }}>
								<Select value={item.field} onChange={(e) => handleColumnChange(item.id, e.target.value)}>
									{filterableColumns.map((col) => (
										<MenuItem key={col.field} value={col.field}>
											{col.headerName ?? col.field}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Operator selector */}
							<FormControl size="small" sx={{ minWidth: 120 }}>
								<Select value={item.operator} onChange={(e) => handleOperatorChange(item.id, e.target.value)}>
									{operators.map((op) => (
										<MenuItem key={op.value} value={op.value}>
											{op.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Value input */}
							<Box sx={{ minWidth: 200, flex: 1 }}>
								<InputComponent
									item={item}
									applyValue={(updatedItem) => handleItemChange(item.id, { value: updatedItem.value as CustomFilterValue })}
								/>
							</Box>

							{/* Remove button */}
							<IconButton size="small" onClick={() => handleRemoveFilter(item.id)} color="error">
								<CloseIcon fontSize="small" />
							</IconButton>
						</Stack>
					);
				})}

				{/* Add filter button row */}
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{ width: 80, flexShrink: 0 }} />

					<Button
						startIcon={<AddIcon />}
						onClick={handleAddFilter}
						size="small"
						variant="outlined"
						disabled={filterableColumns.length === 0 || !filterModel.items.every(filterHasValue)}
						sx={{ minWidth: 150 }}
					>
					{t.filters.addFilter}
				</Button>

				{filterModel.items.length > 0 && (
					<>
						<Button onClick={handleClearAll} size="small" variant="text" color="error">
							{t.filters.removeAllFilters}
						</Button>
						<Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
							{t.common.activeFiltersCount(filterModel.items.filter(filterHasValue).length)}
							</Typography>
						</>
					)}
				</Stack>
			</Stack>
		</Box>
	);
};

export default CustomFilterPanel;
