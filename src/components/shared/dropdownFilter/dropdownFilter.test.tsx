import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DropdownFilter, { createDropdownFilterOperators, createBooleanFilterOperators } from './dropdownFilter';
import type { DropdownFilterOption } from './dropdownFilter';
import type { GridFilterItem, GridFilterInputValueProps, GridColDef } from '@mui/x-data-grid';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

const options: DropdownFilterOption[] = [
	{ value: 'opt1', label: 'Option 1', color: 'primary' },
	{ value: 'opt2', label: 'Option 2' },
];

describe('DropdownFilter component', () => {
	test('renders placeholder text when no value', () => {
		const item = { id: 0, columnField: 'col', value: '' } as unknown as GridFilterItem;
		const applyValue = jest.fn();
		const props = { item, applyValue } as unknown as GridFilterInputValueProps;

		renderWithTheme(<DropdownFilter {...props} options={options} placeholder="Tous" showChips={false} />);

		expect(screen.getByText('Tous')).toBeInTheDocument();
	});

	test('calls applyValue with new value on change', () => {
		const item = { id: 0, columnField: 'col', value: '' } as unknown as GridFilterItem;
		const applyValue = jest.fn();
		const props = { item, applyValue } as unknown as GridFilterInputValueProps;

		renderWithTheme(<DropdownFilter {...props} options={options} placeholder="Tous" showChips={false} />);

		// MUI Select exposes role "combobox" — open the menu and click the option
		const select = screen.getByRole('combobox');
		fireEvent.mouseDown(select); // open the menu
		const option = screen.getByText('Option 1');
		fireEvent.click(option);

		expect(applyValue).toHaveBeenCalled();
		expect(applyValue).toHaveBeenCalledWith(expect.objectContaining({ value: 'opt1' }));
	});

	test('renders Chip when showChips is true and option has color', () => {
		const item = { id: 0, columnField: 'col', value: 'opt1' } as unknown as GridFilterItem;
		const applyValue = jest.fn();
		const props = { item, applyValue } as unknown as GridFilterInputValueProps;

		const { container } = renderWithTheme(
			<DropdownFilter {...props} options={options} placeholder="Tous" showChips={true} />,
		);

		// Chip renders the label text and MUI adds a class like MuiChip-root
		expect(screen.getByText('Option 1')).toBeInTheDocument();
		expect(container.querySelector('.MuiChip-root')).toBeInTheDocument();
	});
});

describe('filter operator helpers', () => {
	test('createDropdownFilterOperators getApplyFilterFn returns null when no value and compares equality when set', () => {
		const ops = createDropdownFilterOperators(options);
		const op = ops[0];

		const colDefString: GridColDef<Record<string, unknown>, string, string> = { field: 'col' };
		const nullFn = op.getApplyFilterFn({ value: '' } as GridFilterItem, colDefString);
		expect(nullFn).toBeNull();

		const applyFn = op.getApplyFilterFn({ value: 'opt1' } as GridFilterItem, colDefString);
		expect(typeof applyFn).toBe('function');
		expect((applyFn as (v: string | null | undefined) => boolean)('opt1')).toBe(true);
		expect((applyFn as (v: string | null | undefined) => boolean)('opt2')).toBe(false);
	});

	test('createBooleanFilterOperators converts string values back to boolean for comparison', () => {
		const boolOptions: DropdownFilterOption[] = [
			{ value: 'true', label: 'Yes' },
			{ value: 'false', label: 'No' },
		];
		const ops = createBooleanFilterOperators(boolOptions);
		const op = ops[0];

		const colDefBool: GridColDef<Record<string, unknown>, boolean, string> = { field: 'col' };

		const nullFn = op.getApplyFilterFn({ value: '' } as GridFilterItem, colDefBool);
		expect(nullFn).toBeNull();

		const applyTrue = op.getApplyFilterFn({ value: 'true' } as GridFilterItem, colDefBool);
		expect((applyTrue as (v: boolean | null | undefined) => boolean)(true)).toBe(true);
		expect((applyTrue as (v: boolean | null | undefined) => boolean)(false)).toBe(false);

		const applyFalse = op.getApplyFilterFn({ value: 'false' } as GridFilterItem, colDefBool);
		expect((applyFalse as (v: boolean | null | undefined) => boolean)(true)).toBe(false);
		expect((applyFalse as (v: boolean | null | undefined) => boolean)(false)).toBe(true);
	});
});
