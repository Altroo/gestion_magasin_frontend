'use client';

import { useSyncExternalStore } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GridPaginationModel } from '@mui/x-data-grid';

const DATA_GRID_PAGINATION_EVENT = 'data-grid-pagination-change';
const DATA_GRID_PAGE_PARAM = 'page';
const DATA_GRID_PAGE_SIZE_PARAM = 'page_size';
const DATA_GRID_PAGE_SIZES = new Set([5, 10, 25, 50, 100]);

const subscribeToDataGridPagination = (listener: () => void) => {
	window.addEventListener('popstate', listener);
	window.addEventListener(DATA_GRID_PAGINATION_EVENT, listener);

	return () => {
		window.removeEventListener('popstate', listener);
		window.removeEventListener(DATA_GRID_PAGINATION_EVENT, listener);
	};
};

const getDataGridPaginationSnapshot = () => window.location.search;
const getDataGridPaginationServerSnapshot = () => '';

export const parseDataGridPagination = (search: string, defaultPageSize = 10, gridKey = ''): GridPaginationModel => {
	const searchParams = new URLSearchParams(search);
	const pageParam = gridKey ? `${gridKey}_${DATA_GRID_PAGE_PARAM}` : DATA_GRID_PAGE_PARAM;
	const pageSizeParam = gridKey ? `${gridKey}_${DATA_GRID_PAGE_SIZE_PARAM}` : DATA_GRID_PAGE_SIZE_PARAM;
	const parsedPage = Number.parseInt(searchParams.get(pageParam) ?? '', 10);
	const parsedPageSize = Number.parseInt(searchParams.get(pageSizeParam) ?? '', 10);

	return {
		page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0,
		pageSize: DATA_GRID_PAGE_SIZES.has(parsedPageSize) ? parsedPageSize : defaultPageSize,
	};
};

export const useDataGridPagination = (
	defaultPageSize = 10,
	gridKey = '',
): [GridPaginationModel, Dispatch<SetStateAction<GridPaginationModel>>] => {
	const search = useSyncExternalStore(
		subscribeToDataGridPagination,
		getDataGridPaginationSnapshot,
		getDataGridPaginationServerSnapshot,
	);
	const paginationModel = parseDataGridPagination(search, defaultPageSize, gridKey);

	const setPaginationModel: Dispatch<SetStateAction<GridPaginationModel>> = (value) => {
		const currentPaginationModel = parseDataGridPagination(window.location.search, defaultPageSize, gridKey);
		const nextPaginationModel = typeof value === 'function' ? value(currentPaginationModel) : value;

		if (
			nextPaginationModel.page === currentPaginationModel.page &&
			nextPaginationModel.pageSize === currentPaginationModel.pageSize
		) {
			return;
		}

		const url = new URL(window.location.href);
		url.searchParams.set(
			gridKey ? `${gridKey}_${DATA_GRID_PAGE_PARAM}` : DATA_GRID_PAGE_PARAM,
			String(nextPaginationModel.page + 1),
		);
		url.searchParams.set(
			gridKey ? `${gridKey}_${DATA_GRID_PAGE_SIZE_PARAM}` : DATA_GRID_PAGE_SIZE_PARAM,
			String(nextPaginationModel.pageSize),
		);
		window.history.replaceState(window.history.state, '', url);
		window.dispatchEvent(new Event(DATA_GRID_PAGINATION_EVENT));
	};

	return [paginationModel, setPaginationModel];
};
