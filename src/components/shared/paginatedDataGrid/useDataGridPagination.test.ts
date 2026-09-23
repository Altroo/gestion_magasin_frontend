import { act, renderHook } from '@testing-library/react';
import { parseDataGridPagination, useDataGridPagination } from './useDataGridPagination';

describe('useDataGridPagination', () => {
	it('parses one-based URL pages and rejects unsupported sizes', () => {
		expect(parseDataGridPagination('?page=3&page_size=50')).toEqual({ page: 2, pageSize: 50 });
		expect(parseDataGridPagination('?page=0&page_size=12')).toEqual({ page: 0, pageSize: 10 });
		expect(parseDataGridPagination('?lines_page=4&lines_page_size=25', 5, 'lines')).toEqual({
			page: 3,
			pageSize: 25,
		});
	});

	it('updates its URL parameters while preserving other grids, filters and the hash', () => {
		window.history.replaceState({}, '', '/dashboard/items?company_id=7&page=3&page_size=50#details');
		const { result } = renderHook(() => useDataGridPagination(5, 'lines'));

		act(() => {
			result.current[1]({ page: 2, pageSize: 25 });
		});

		expect(result.current[0]).toEqual({ page: 2, pageSize: 25 });
		expect(window.location.search).toBe('?company_id=7&page=3&page_size=50&lines_page=3&lines_page_size=25');
		expect(window.location.hash).toBe('#details');
	});

	it('restores the grid page after browser navigation', () => {
		window.history.replaceState({}, '', '/dashboard/items');
		const { result } = renderHook(() => useDataGridPagination());

		act(() => {
			window.history.pushState({}, '', '/dashboard/items?page=6&page_size=100');
			window.dispatchEvent(new PopStateEvent('popstate'));
		});

		expect(result.current[0]).toEqual({ page: 5, pageSize: 100 });
	});
});
