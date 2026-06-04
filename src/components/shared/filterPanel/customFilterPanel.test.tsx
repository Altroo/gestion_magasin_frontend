import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CustomFilterPanel, { filterHasValue, type CustomFilterItem, type CustomFilterModel } from './customFilterPanel';
import { GridLogicOperator, type GridColDef } from '@mui/x-data-grid';

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

const mockColumns: GridColDef[] = [
	{
		field: 'name',
		headerName: 'Nom',
		filterable: true,
	},
	{
		field: 'email',
		headerName: 'Email',
		filterable: true,
	},
	{
		field: 'age',
		headerName: 'Âge',
		filterable: true,
		filterOperators: [
			{
				value: 'numEquals',
				label: '=',
				getApplyFilterFn: () => null,
				InputComponent: () => null,
			},
			{
				value: 'numGreaterThan',
				label: '>',
				getApplyFilterFn: () => null,
				InputComponent: () => null,
			},
		],
	},
	{
		field: 'actions',
		headerName: 'Actions',
		filterable: false,
	},
];

describe('CustomFilterPanel', () => {
	describe('filterHasValue utility function', () => {
		test('returns true for isEmpty operator (value-less)', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'name',
				operator: 'isEmpty',
				value: '',
			};
			expect(filterHasValue(item)).toBe(true);
		});

		test('returns true for isNotEmpty operator (value-less)', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'name',
				operator: 'isNotEmpty',
				value: '',
			};
			expect(filterHasValue(item)).toBe(true);
		});

		test('returns true for non-empty string value', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'name',
				operator: 'contains',
				value: 'test',
			};
			expect(filterHasValue(item)).toBe(true);
		});

		test('returns false for empty string value', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'name',
				operator: 'contains',
				value: '',
			};
			expect(filterHasValue(item)).toBe(false);
		});

		test('returns false for whitespace-only string value', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'name',
				operator: 'contains',
				value: '   ',
			};
			expect(filterHasValue(item)).toBe(false);
		});

		test('returns true for date range with from value', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'date',
				operator: 'dateRange',
				value: { from: '2026-01-01' },
			};
			expect(filterHasValue(item)).toBe(true);
		});

		test('returns true for date range with to value', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'date',
				operator: 'dateRange',
				value: { to: '2026-12-31' },
			};
			expect(filterHasValue(item)).toBe(true);
		});

		test('returns false for empty date range', () => {
			const item: CustomFilterItem = {
				id: '1',
				field: 'date',
				operator: 'dateRange',
				value: {},
			};
			expect(filterHasValue(item)).toBe(false);
		});
	});

	describe('CustomFilterPanel component', () => {
		test('renders empty state initially', () => {
			const filterModel: CustomFilterModel = {
				items: [],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			expect(screen.getByRole('button', { name: /ajouter un filtre/i })).toBeInTheDocument();
			expect(screen.queryByText(/filtre\(s\) actif\(s\)/)).not.toBeInTheDocument();
		});

		test('adds a new filter when add button is clicked', () => {
			const filterModel: CustomFilterModel = {
				items: [],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const addButton = screen.getByRole('button', { name: /ajouter un filtre/i });
			fireEvent.click(addButton);

			expect(mockOnChange).toHaveBeenCalledTimes(1);
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items).toHaveLength(1);
			expect(newModel.items[0]).toMatchObject({
				field: 'name',
				operator: 'contains',
				value: '',
			});
		});

		test('disables add button when a filter has no value', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: '',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const addButton = screen.getByRole('button', { name: /ajouter un filtre/i });
			expect(addButton).toBeDisabled();
		});

		test('enables add button when all filters have values', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const addButton = screen.getByRole('button', { name: /ajouter un filtre/i });
			expect(addButton).not.toBeDisabled();
		});

		test('removes a filter when close button is clicked', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const closeButton = screen.getByRole('button', { name: '' });
			fireEvent.click(closeButton);

			expect(mockOnChange).toHaveBeenCalledTimes(1);
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items).toHaveLength(0);
		});

		test('clears all filters when clear all button is clicked', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test1',
					},
					{
						id: '2',
						field: 'email',
						operator: 'contains',
						value: 'test2',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const clearButton = screen.getByRole('button', { name: /supprimer tous les filtres/i });
			fireEvent.click(clearButton);

			expect(mockOnChange).toHaveBeenCalledTimes(1);
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items).toHaveLength(0);
		});

		test('updates filter value when text input changes', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: '',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const textInput = screen.getByPlaceholderText('Valeur');
			fireEvent.change(textInput, { target: { value: 'new value' } });

			expect(mockOnChange).toHaveBeenCalled();
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items[0].value).toBe('new value');
		});

		test('changes filter column when column selector changes', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const columnSelect = screen.getAllByRole('combobox')[0];
			fireEvent.mouseDown(columnSelect);

			const emailOption = screen.getByRole('option', { name: 'Email' });
			fireEvent.click(emailOption);

			expect(mockOnChange).toHaveBeenCalled();
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items[0].field).toBe('email');
			expect(newModel.items[0].value).toBe('');
		});

		test('changes filter operator when operator selector changes', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const operatorSelect = screen.getAllByRole('combobox')[1];
			fireEvent.mouseDown(operatorSelect);

			const equalsOption = screen.getByRole('option', { name: 'égal à' });
			fireEvent.click(equalsOption);

			expect(mockOnChange).toHaveBeenCalled();
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items[0].operator).toBe('equals');
		});

		test('hides value input for isEmpty operator', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'isEmpty',
						value: '',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			expect(screen.queryByPlaceholderText('Valeur')).not.toBeInTheDocument();
		});

		test('shows logic operator selector on second filter', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test1',
					},
					{
						id: '2',
						field: 'email',
						operator: 'contains',
						value: 'test2',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const logicOperatorSelects = screen.getAllByRole('combobox').filter((el) => {
				const parent = el.closest('.MuiFormControl-root');
				return parent && within(parent as HTMLElement).queryByText('ET');
			});

			expect(logicOperatorSelects.length).toBeGreaterThan(0);
		});

		test('shows logic operator as styled box on third+ filters', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test1',
					},
					{
						id: '2',
						field: 'email',
						operator: 'contains',
						value: 'test2',
					},
					{
						id: '3',
						field: 'age',
						operator: 'numEquals',
						value: '25',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const etBoxes = screen.getAllByText('ET');
			expect(etBoxes.length).toBeGreaterThanOrEqual(1);
		});

		test('changes logic operator from AND to OR', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test1',
					},
					{
						id: '2',
						field: 'email',
						operator: 'contains',
						value: 'test2',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const comboboxes = screen.getAllByRole('combobox');
			const logicSelect = comboboxes.find((cb) => {
				const parent = cb.closest('.MuiSelect-select');
				return parent && parent.textContent === 'ET';
			});

			if (logicSelect) {
				fireEvent.mouseDown(logicSelect);
				const ouOption = screen.getByRole('option', { name: 'OU' });
				fireEvent.click(ouOption);

				expect(mockOnChange).toHaveBeenCalled();
				const newModel = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0] as CustomFilterModel;
				expect(newModel.logicOperator).toBe(GridLogicOperator.Or);
			}
		});

		test('displays active filter count', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test1',
					},
					{
						id: '2',
						field: 'email',
						operator: 'isEmpty',
						value: '',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			expect(screen.getByText('2 filtre(s) actif(s)')).toBeInTheDocument();
		});

		test('uses column-specific filter operators when available', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'age',
						operator: 'numEquals',
						value: '25',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const operatorSelect = screen.getAllByRole('combobox')[1];
			fireEvent.mouseDown(operatorSelect);

			expect(screen.getByRole('option', { name: '=' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: '>' })).toBeInTheDocument();
		});

		test('resets value when switching to value-less operator', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const operatorSelect = screen.getAllByRole('combobox')[1];
			fireEvent.mouseDown(operatorSelect);

			const isEmptyOption = screen.getByRole('option', { name: 'est vide' });
			fireEvent.click(isEmptyOption);

			expect(mockOnChange).toHaveBeenCalled();
			const newModel = mockOnChange.mock.calls[0][0] as CustomFilterModel;
			expect(newModel.items[0].value).toBe('');
		});

		test('filters out non-filterable columns', () => {
			const filterModel: CustomFilterModel = {
				items: [
					{
						id: '1',
						field: 'name',
						operator: 'contains',
						value: 'test',
					},
				],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={mockColumns} filterModel={filterModel} onChange={mockOnChange} />);

			const columnSelect = screen.getAllByRole('combobox')[0];
			fireEvent.mouseDown(columnSelect);

			expect(screen.queryByRole('option', { name: 'Actions' })).not.toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Nom' })).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Email' })).toBeInTheDocument();
		});

		test('handles empty columns array', () => {
			const filterModel: CustomFilterModel = {
				items: [],
				logicOperator: GridLogicOperator.And,
			};
			const mockOnChange = jest.fn();

			render(<CustomFilterPanel columns={[]} filterModel={filterModel} onChange={mockOnChange} />);

			const addButton = screen.getByRole('button', { name: /ajouter un filtre/i });
			expect(addButton).toBeDisabled();
		});
	});
});
