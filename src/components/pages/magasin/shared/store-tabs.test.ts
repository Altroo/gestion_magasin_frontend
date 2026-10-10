import { createElement } from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import StoreTabs, { isStoreTabVisible, useSelectedStore } from './store-tabs';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { getChatAIStore } from '@/utils/chatAIStoreScope';
import type { StoreMembershipType } from '@/types/gestionMagasinTypes';

const membership = (code: string): StoreMembershipType =>
	({
		is_active: true,
		store: {
			is_active: true,
			is_global_stock: false,
			code,
			name: code,
		},
	}) as StoreMembershipType;

describe('isStoreTabVisible', () => {
	it('keeps MBR SOUTH hidden by default', () => {
		expect(isStoreTabVisible(membership('mbr-south'))).toBe(false);
	});

	it('allows MBR SOUTH when requested by the pointage module', () => {
		expect(isStoreTabVisible(membership('mbr-south'), true)).toBe(true);
	});

	it('keeps regular stores visible', () => {
		expect(isStoreTabVisible(membership('casablanca'))).toBe(true);
	});
});

jest.mock('@/utils/hooks', () => ({
	useAppSelector: () => ({ id: 11 }),
	useLanguage: () => ({ t: jest.requireActual('@/translations').translations.fr }),
}));
const mockSearchParams = new URLSearchParams();
const mockMemberships: StoreMembershipType[] = [];
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
	useSearchParams: () => mockSearchParams,
	usePathname: () => '/dashboard/article',
	useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@/store/services/magasin', () => ({
	useGetMyStoresQuery: () => ({ data: mockMemberships, isLoading: false }),
}));

describe('store context on list return', () => {
	beforeEach(() => {
		mockSearchParams.delete('store_id');
		mockSearchParams.delete('page');
		mockReplace.mockReset();
		localStorage.clear();
		window.history.replaceState({}, '', '/dashboard/article');
		localStorage.setItem('gestion-magasin:selected-store-id', '1');
		mockMemberships.splice(
			0,
			mockMemberships.length,
			{ ...membership('first'), store: { ...membership('first').store, id: 1 } },
			{ ...membership('second'), store: { ...membership('second').store, id: 2 } },
		);
	});

	it('opens the authorized linked store instead of the previous tab', () => {
		mockSearchParams.set('store_id', '2');
		const { result } = renderHook(() => useSelectedStore());
		expect(result.current.defaultStore?.id).toBe(2);
	});

	it.each(['999', '-1', 'invalid'])('ignores an unauthorized or invalid hint %s', (hint) => {
		mockSearchParams.set('store_id', hint);
		const { result } = renderHook(() => useSelectedStore());
		expect(result.current.defaultStore?.id).toBe(1);
	});

	it('ignores a store whose membership was revoked', () => {
		mockMemberships[1].is_active = false;
		mockSearchParams.set('store_id', '2');
		const { result } = renderHook(() => useSelectedStore());
		expect(result.current.defaultStore?.id).toBe(1);
	});

	it('keeps restricted stores hidden outside their supported module', () => {
		mockMemberships[1].store.code = 'mbr-south';
		mockSearchParams.set('store_id', '2');
		const { result } = renderHook(() => useSelectedStore());
		expect(result.current.defaultStore?.id).toBe(1);
		const pointage = renderHook(() => useSelectedStore(undefined, true));
		expect(pointage.result.current.defaultStore?.id).toBe(2);
	});

	it('keeps a manual store switch after reloading a store-specific list', () => {
		mockSearchParams.set('store_id', '2');
		mockSearchParams.set('page', '3');
		window.history.replaceState({}, '', '/dashboard/article?store_id=2&page=3&ordering=name#items');
		const pagination = renderHook(() => useDataGridPagination());
		mockReplace.mockImplementation((href: string) => {
			mockSearchParams.set('store_id', new URL(href, 'http://localhost').searchParams.get('store_id')!);
		});
		const onChange = jest.fn(() => pagination.result.current[1]((current) => ({ ...current, page: 0 })));
		const view = render(createElement(StoreTabs, { selectedStoreId: 2, onChange }));
		fireEvent.click(screen.getByRole('tab', { name: 'first' }));
		expect(onChange).toHaveBeenCalledWith(1);
		expect(mockReplace).toHaveBeenCalledWith('/dashboard/article?store_id=1&page=1&ordering=name&page_size=10#items', {
			scroll: false,
		});
		expect(pagination.result.current[0].page).toBe(0);
		view.unmount();
		const reloaded = renderHook(() => useSelectedStore());
		expect(reloaded.result.current.defaultStore?.id).toBe(1);
	});
});

it('publishes only the mounted authorized active tab and clears on unmount', () => {
	const view = render(createElement(StoreTabs, { selectedStoreId: 2, onChange: jest.fn() }));
	expect(getChatAIStore()).toEqual({ pathname: '/dashboard/article', owner: 11, storeId: 2 });
	view.rerender(createElement(StoreTabs, { selectedStoreId: 999, onChange: jest.fn() }));
	expect(getChatAIStore()).toBeNull();
	view.unmount();
	expect(getChatAIStore()).toBeNull();
});
