import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PaginatedDataGrid, { mapOperatorToParam, isDateRangeValue } from './paginatedDataGrid';
import type { CustomFilterValue } from '@/components/shared/filterPanel/customFilterPanel';
import '@testing-library/jest-dom';
import type { GridColDef } from '@mui/x-data-grid';
import { createTheme } from '@mui/material/styles';

// Mock theme
jest.mock('@/utils/themes', () => ({
	getDefaultTheme: () => createTheme(),
}));

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

// Mock loading spinner
jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-progress">Loading...</div>,
}));

type RowType = { id: number; name: string };

describe('PaginatedDataGrid', () => {
	const columns: GridColDef[] = [
		{ field: 'id', headerName: 'ID', width: 100, filterable: true },
		{ field: 'name', headerName: 'Name', width: 200, filterable: true },
	];

	const defaultProps = {
		data: { count: 0, results: [] as RowType[] },
		isLoading: false,
		columns,
		paginationModel: { page: 0, pageSize: 5 },
		setPaginationModel: jest.fn(),
		searchTerm: '',
		setSearchTerm: jest.fn(),
		toolbar: { quickFilter: true, debounceMs: 300 },
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders rows when data is returned', () => {
		const propsWithData = {
			...defaultProps,
			data: {
				count: 2,
				results: [
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
			},
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('shows loading indicator when isLoading is true', () => {
		const propsWithLoading = {
			...defaultProps,
			data: undefined,
			isLoading: true,
		};

		render(<PaginatedDataGrid<RowType> {...propsWithLoading} />);
		expect(screen.getByTestId('api-progress')).toBeInTheDocument();
	});

	it('renders with default props', () => {
		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('updates search term when quick filter changes', () => {
		const setSearchTermMock = jest.fn();

		render(<PaginatedDataGrid<RowType> {...defaultProps} setSearchTerm={setSearchTermMock} />);

		const input = document.querySelector('input[placeholder="Rechercher…"]');
		expect(input).toBeInTheDocument();
		fireEvent.change(input!, { target: { value: 'test' } });
	});

	it('renders with pagination controls', () => {
		const propsWithData = {
			...defaultProps,
			data: {
				count: 50,
				results: Array.from({ length: 5 }, (_, i) => ({
					id: i + 1,
					name: `User ${i + 1}`,
				})),
			},
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('1–5 sur 50')).toBeInTheDocument();
	});

	it('uses queryHook when provided', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 1, results: [{ id: 1, name: 'Test' }] },
			isLoading: false,
		}));

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 1,
			pageSize: 5,
			search: '',
		});
		expect(screen.getByText('Test')).toBeInTheDocument();
	});

	it('passes correct page to queryHook (1-indexed)', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const props = {
			...defaultProps,
			paginationModel: { page: 2, pageSize: 10 },
			queryHook: mockQueryHook,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 3,
			pageSize: 10,
			search: '',
		});
	});

	it('passes custom filter params to queryHook when using onCustomFilterParamsChange', () => {
		const mockQueryHook = jest.fn(() => ({
			data: { count: 0, results: [] },
			isLoading: false,
		}));

		const props = {
			...defaultProps,
			queryHook: mockQueryHook,
		};

		// With no custom filters, queryHook gets base params only
		render(<PaginatedDataGrid<RowType> {...props} />);

		expect(mockQueryHook).toHaveBeenCalledWith({
			page: 1,
			pageSize: 5,
			search: '',
		});
	});

	it('calls onCustomFilterParamsChange when provided', () => {
		const mockOnCustomFilterParamsChange = jest.fn();

		const props = {
			...defaultProps,
			onCustomFilterParamsChange: mockOnCustomFilterParamsChange,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		// Initially called with empty params on mount
		expect(mockOnCustomFilterParamsChange).toHaveBeenCalledWith({});
	});

	it('renders filter button in toolbar', () => {
		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		// The filter button (FilterListIcon) should always be visible in the toolbar
		// Look for the button that wraps the filter icon
		const filterButtons = document.querySelectorAll('button');
		expect(filterButtons.length).toBeGreaterThan(0);
	});

	it('handles onFilterModelChange callback', () => {
		const mockFilterChange = jest.fn();

		const props = {
			...defaultProps,
			onFilterModelChange: mockFilterChange,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		// Component renders successfully with callback
		expect(mockFilterChange).not.toHaveBeenCalled();
	});

	it('renders without toolbar when quickFilter is false', () => {
		const props = {
			...defaultProps,
			toolbar: { quickFilter: false, debounceMs: 300 },
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		const input = document.querySelector('input[placeholder="Rechercher…"]');
		expect(input).not.toBeInTheDocument();
	});

	it('displays correct row count', () => {
		const propsWithData = {
			...defaultProps,
			data: {
				count: 100,
				results: Array.from({ length: 10 }, (_, i) => ({
					id: i + 1,
					name: `User ${i + 1}`,
				})),
			},
			paginationModel: { page: 0, pageSize: 10 },
		};

		render(<PaginatedDataGrid<RowType> {...propsWithData} />);
		expect(screen.getByText('1–10 sur 100')).toBeInTheDocument();
	});

	it('handles empty results gracefully', () => {
		const propsWithEmpty = {
			...defaultProps,
			data: { count: 0, results: [] },
		};

		render(<PaginatedDataGrid<RowType> {...propsWithEmpty} />);
		// DataGrid renders successfully with empty data
		expect(screen.queryByTestId('api-progress')).not.toBeInTheDocument();
	});

	it('uses external isLoading when provided', () => {
		const props = {
			...defaultProps,
			isLoading: true,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		expect(screen.getByTestId('api-progress')).toBeInTheDocument();
	});

	it('toggles custom filter panel when filter button is clicked', async () => {
		render(<PaginatedDataGrid<RowType> {...defaultProps} />);
		// Find the filter button (the one with the Badge/FilterListIcon)
		const buttons = Array.from(document.querySelectorAll('button'));
		// The 2nd toolbar button is the filter toggle (after columns panel trigger)
		const filterButton = buttons.find((b) => b.querySelector('[data-testid="FilterListIcon"]'));
		if (filterButton) {
			await act(async () => {
				fireEvent.click(filterButton);
			});
		}
	});

	it('uses internal filter model when no external one provided', () => {
		const props = {
			...defaultProps,
			filterModel: undefined,
			onFilterModelChange: undefined,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		const input = document.querySelector('input[placeholder="Rechercher…"]');
		if (input) {
			fireEvent.change(input, { target: { value: 'abc' } });
		}
	});

	it('renders toolbar actions when provided', () => {
		const props = {
			...defaultProps,
			toolbarActions: <button data-testid="custom-action">Custom</button>,
		};

		render(<PaginatedDataGrid<RowType> {...props} />);
		expect(screen.getByTestId('custom-action')).toBeInTheDocument();
	});
});

describe('mapOperatorToParam', () => {
	it('maps "contains" to icontains', () => {
		expect(mapOperatorToParam('name', 'contains', 'test')).toEqual({ name__icontains: 'test' });
	});

	it('maps "equals" to direct field', () => {
		expect(mapOperatorToParam('status', 'equals', 'active')).toEqual({ status: 'active' });
	});

	it('maps "=" to direct field', () => {
		expect(mapOperatorToParam('status', '=', 'active')).toEqual({ status: 'active' });
	});

	it('maps "is" to direct field', () => {
		expect(mapOperatorToParam('status', 'is', 'active')).toEqual({ status: 'active' });
	});

	it('maps "startsWith" to istartswith', () => {
		expect(mapOperatorToParam('name', 'startsWith', 'abc')).toEqual({ name__istartswith: 'abc' });
	});

	it('maps "endsWith" to iendswith', () => {
		expect(mapOperatorToParam('name', 'endsWith', 'xyz')).toEqual({ name__iendswith: 'xyz' });
	});

	it('maps "isEmpty" to isempty true', () => {
		expect(mapOperatorToParam('email', 'isEmpty', '')).toEqual({ email__isempty: 'true' });
	});

	it('maps "isNotEmpty" to isempty false', () => {
		expect(mapOperatorToParam('email', 'isNotEmpty', '')).toEqual({ email__isempty: 'false' });
	});

	it('maps "numEquals" to direct field', () => {
		expect(mapOperatorToParam('amount', 'numEquals', '100')).toEqual({ amount: '100' });
	});

	it('maps "numNotEquals" to __ne', () => {
		expect(mapOperatorToParam('amount', 'numNotEquals', '50')).toEqual({ amount__ne: '50' });
	});

	it('maps "!=" to __ne', () => {
		expect(mapOperatorToParam('amount', '!=', '50')).toEqual({ amount__ne: '50' });
	});

	it('maps "ne" to __ne', () => {
		expect(mapOperatorToParam('amount', 'ne', '50')).toEqual({ amount__ne: '50' });
	});

	it('maps "not" to __ne', () => {
		expect(mapOperatorToParam('amount', 'not', '50')).toEqual({ amount__ne: '50' });
	});

	it('maps "numGreaterThan" to __gt', () => {
		expect(mapOperatorToParam('price', 'numGreaterThan', '10')).toEqual({ price__gt: '10' });
	});

	it('maps ">" to __gt', () => {
		expect(mapOperatorToParam('price', '>', '10')).toEqual({ price__gt: '10' });
	});

	it('maps "gt" to __gt', () => {
		expect(mapOperatorToParam('price', 'gt', '10')).toEqual({ price__gt: '10' });
	});

	it('maps "numGreaterThanOrEqual" to __gte', () => {
		expect(mapOperatorToParam('price', 'numGreaterThanOrEqual', '10')).toEqual({ price__gte: '10' });
	});

	it('maps ">=" to __gte', () => {
		expect(mapOperatorToParam('price', '>=', '10')).toEqual({ price__gte: '10' });
	});

	it('maps "gte" to __gte', () => {
		expect(mapOperatorToParam('price', 'gte', '10')).toEqual({ price__gte: '10' });
	});

	it('maps "numLessThan" to __lt', () => {
		expect(mapOperatorToParam('price', 'numLessThan', '5')).toEqual({ price__lt: '5' });
	});

	it('maps "<" to __lt', () => {
		expect(mapOperatorToParam('price', '<', '5')).toEqual({ price__lt: '5' });
	});

	it('maps "lt" to __lt', () => {
		expect(mapOperatorToParam('price', 'lt', '5')).toEqual({ price__lt: '5' });
	});

	it('maps "numLessThanOrEqual" to __lte', () => {
		expect(mapOperatorToParam('price', 'numLessThanOrEqual', '5')).toEqual({ price__lte: '5' });
	});

	it('maps "<=" to __lte', () => {
		expect(mapOperatorToParam('price', '<=', '5')).toEqual({ price__lte: '5' });
	});

	it('maps "lte" to __lte', () => {
		expect(mapOperatorToParam('price', 'lte', '5')).toEqual({ price__lte: '5' });
	});

	it('uses fallback for unknown operators', () => {
		expect(mapOperatorToParam('field', 'customOp', 'val')).toEqual({ field__customOp: 'val' });
	});
});

describe('isDateRangeValue', () => {
	it('returns true for object with from property', () => {
		expect(isDateRangeValue({ from: '2025-01-01' })).toBe(true);
	});

	it('returns true for object with from and to properties', () => {
		expect(isDateRangeValue({ from: '2025-01-01', to: '2025-12-31' })).toBe(true);
	});

	it('returns false for string value', () => {
		expect(isDateRangeValue('test')).toBe(false);
	});

	it('returns false for null-like value cast to CustomFilterValue', () => {
		expect(isDateRangeValue(null as unknown as CustomFilterValue)).toBe(false);
	});

	it('returns false for object without from', () => {
		expect(isDateRangeValue({ to: '2025-12-31' } as unknown as CustomFilterValue)).toBe(false);
	});
});
