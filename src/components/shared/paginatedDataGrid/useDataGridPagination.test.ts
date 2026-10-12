// Model Next's canonical query independently from the browser history commit.
let mockCanonicalSearch: string | null = null;
jest.mock('next/navigation', () => ({
	useSearchParams: () => {
		const React = jest.requireActual<typeof import('react')>('react');
		const search = React.useSyncExternalStore(
			(listener) => {
				window.addEventListener('popstate', listener);
				window.addEventListener('test-next-query', listener);
				return () => {
					window.removeEventListener('popstate', listener);
					window.removeEventListener('test-next-query', listener);
				};
			},
			() => mockCanonicalSearch ?? window.location.search,
			() => '',
		);
		return new URLSearchParams(search);
	},
}));
const replaceState = window.history.replaceState.bind(window.history);
beforeAll(() => jest.spyOn(window.history, 'replaceState').mockImplementation((...args) => {
	replaceState(...args);
	window.dispatchEvent(new Event('test-next-query'));
}));
afterAll(() => jest.restoreAllMocks());
afterEach(() => { mockCanonicalSearch = null; });

import { listReturnUrl } from '@/utils/listReturn';
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

describe('server ordering', () => {
	it('keeps independent sorting and pagination for two grids', () => {
		window.history.replaceState({}, '', '/dashboard/test?page=3&page_size=25&requests_page=2&store=7#grid');
		const { result } = renderHook(() => ({
			main: useDataGridPagination(),
			requests: useDataGridPagination(5, 'requests'),
		}));
		act(() => result.current.main[2].onSortModelChange([{ field: 'name', sort: 'asc' }]));
		expect(result.current.main[2].ordering).toBe('name');
		expect(result.current.main[0].page).toBe(0);
		expect(result.current.requests[0].page).toBe(1);
		act(() => result.current.requests[2].onSortModelChange([{ field: 'quantity', sort: 'desc' }]));
		expect(result.current.requests[2].ordering).toBe('-quantity');
		expect(result.current.main[2].ordering).toBe('name');
		act(() => result.current.main[1]({ page: 2, pageSize: 25 }));
		expect(result.current.main[2].sortModel).toEqual([{ field: 'name', sort: 'asc' }]);
		expect(window.location.search).toContain('store=7');
		expect(window.location.hash).toBe('#grid');
	});
});

it('preserves the sort model identity when only the page changes', () => {
	window.history.replaceState({}, '', '/dashboard/list?ordering=name');
	const { result } = renderHook(() => useDataGridPagination());
	const sortModel = result.current[2].sortModel;
	act(() => result.current[1]({ page: 2, pageSize: 10 }));
	expect(result.current[2].sortModel).toBe(sortModel);
});


it('records list pagination for an explicit return after unmount, without restoring fresh navigation', () => {
	window.sessionStorage.clear();
	window.history.replaceState({}, '', '/dashboard/users?page=3&page_size=10');
	const first = renderHook(() => useDataGridPagination());
	first.unmount();
	window.history.replaceState({}, '', '/dashboard/users/42');
	expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users?page=3&page_size=10');
	window.history.replaceState({}, '', '/dashboard/users');
	const fresh = renderHook(() => useDataGridPagination());
	expect(fresh.result.current[0].page).toBe(0);
	expect(listReturnUrl('/dashboard/users')).toBe('/dashboard/users');
});

it('reads the destination query before Next commits browser history', () => {
	window.history.replaceState({}, '', '/dashboard/items/42');
	mockCanonicalSearch = '?page=3&page_size=25&ordering=-name';
	const { result } = renderHook(() => useDataGridPagination());
	expect(result.current[0]).toEqual({ page: 2, pageSize: 25 });
	expect(result.current[2].ordering).toBe('-name');
	expect(window.location.pathname).toBe('/dashboard/items/42');
});

it('does not pass Next internal history markers when changing pagination', () => {
	window.history.replaceState({ __NA: true }, '', '/dashboard/items?page=3&page_size=25');
	const { result } = renderHook(() => useDataGridPagination());
	act(() => result.current[1]({ page: 3, pageSize: 25 }));
	expect(window.history.replaceState).toHaveBeenLastCalledWith(null, '', expect.any(URL));
	expect(result.current[0]).toEqual({ page: 3, pageSize: 25 });
});
