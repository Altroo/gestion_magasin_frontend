'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chip, Stack } from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	Visibility as VisibilityIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx } from '@/components/pages/magasin/shared/page-layout';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import { createBooleanFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useGetCategoriesQuery,
	useGetProductUnitsQuery,
	useGetStockBalancesQuery,
	useGetStoresQuery,
} from '@/store/services/magasin';
import type { SessionProps } from '@/types/_initTypes';
import type { StockBalanceType } from '@/types/gestionMagasinTypes';
import { formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage } from '@/utils/hooks';
import { STORE_STOCK_VIEW } from '@/utils/routes';

const StoreStockOverviewClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const { data, isLoading } = useGetStockBalancesQuery(
		{
			search: searchTerm,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			exclude_global_stock: true,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token },
	);
	const { data: stores } = useGetStoresQuery({ page: 1, pageSize: 100, is_active: true }, { skip: !token });
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !token });
	const { data: productUnits } = useGetProductUnitsQuery(undefined, { skip: !token });

	const booleanFilterOptions = useMemo(
		() => [
			{ value: 'true', label: t.magasin.lowStockReached },
			{ value: 'false', label: t.magasin.stockSufficient },
		],
		[t.magasin.lowStockReached, t.magasin.stockSufficient],
	);

	const chipFilters = useMemo(
		() => [
			{
				key: 'store',
				label: t.magasin.store,
				paramName: 'store_ids',
				options: (stores?.results ?? [])
					.filter((store) => !store.is_global_stock)
					.map((store) => ({ id: String(store.id), nom: store.name })),
			},
			{
				key: 'category',
				label: t.magasin.category,
				paramName: 'category_ids',
				options: (categories?.results ?? []).map((category) => ({ id: String(category.id), nom: category.name })),
			},
			{
				key: 'unit',
				label: t.magasin.unit,
				paramName: 'unit_ids',
				options: (productUnits?.results ?? []).map((unit) => ({ id: String(unit.id), nom: unit.name })),
			},
			{
				key: 'stock',
				label: t.magasin.lowStockStatus,
				paramName: 'low',
				options: [
					{ id: 'true', nom: t.magasin.lowStockReached },
					{ id: 'false', nom: t.magasin.stockSufficient },
				],
			},
		],
		[
			categories?.results,
			productUnits?.results,
			stores?.results,
			t.magasin.category,
			t.magasin.lowStockReached,
			t.magasin.lowStockStatus,
			t.magasin.stockSufficient,
			t.magasin.store,
			t.magasin.unit,
		],
	);

	const columns: GridColDef[] = [
		{
			field: 'store_name',
			headerName: t.magasin.store,
			flex: 1.2,
			minWidth: 160,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell fontWeight={600}>{params.value}</TooltipTextCell>
			),
		},
		{
			field: 'product_reference',
			headerName: t.magasin.reference,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell title={params.value ?? params.row.product_barcode ?? '-'}>
					{params.value ?? params.row.product_barcode ?? '-'}
				</TooltipTextCell>
			),
		},
		{
			field: 'product_name',
			headerName: t.magasin.product,
			flex: 1.7,
			minWidth: 190,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell fontWeight={600}>{params.value}</TooltipTextCell>
			),
		},
		{
			field: 'category_name',
			headerName: t.magasin.category,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'unit_name',
			headerName: t.magasin.unit,
			flex: 0.8,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'quantity',
			headerName: t.magasin.currentStock,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell fontWeight={600}>{formatNumber(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'effective_min_stock',
			headerName: t.magasin.minimumStock,
			flex: 0.9,
			minWidth: 140,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{formatNumber(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'average_cost',
			headerName: t.magasin.averageCost,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>
					{formatNumber(params.value as string)} Dhs
				</TooltipTextCell>
			),
		},
		{
			field: 'product_purchase_price',
			headerName: t.magasin.purchasePrice,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>
					{formatNumber(params.value as string)} Dhs
				</TooltipTextCell>
			),
		},
		{
			field: 'is_low_stock',
			headerName: t.magasin.lowStockStatus,
			flex: 0.9,
			minWidth: 150,
			filterOperators: createBooleanFilterOperators(booleanFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<StockBalanceType>) =>
				params.value ? (
					<DarkTooltip title={t.magasin.lowStockReached}>
						<Chip icon={<WarningIcon />} label={t.magasin.lowStockReached} color="warning" size="small" />
					</DarkTooltip>
				) : (
					<DarkTooltip title={t.magasin.stockSufficient}>
						<Chip icon={<CheckCircleIcon />} label={t.magasin.stockSufficient} color="success" size="small" variant="outlined" />
					</DarkTooltip>
				),
		},
		{
			field: 'date_updated',
			headerName: t.users.lastUpdate,
			flex: 1,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<TooltipTextCell>{formatDate(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 0.7,
			minWidth: 110,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<StockBalanceType>) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <VisibilityIcon />,
							onClick: () => router.push(STORE_STOCK_VIEW(params.row.id, params.row.store)),
							color: 'info',
						},
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.storeStockOverview}>
			<Protected>
				<Stack sx={magasinPageContainerSx} spacing={1}>
					<Stack sx={{ mb: { xs: 1.5, md: 2 } }}>
						<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />
					</Stack>
					<PaginatedDataGrid
						data={data}
						isLoading={isLoading}
						columns={columns}
						paginationModel={paginationModel}
						setPaginationModel={setPaginationModel}
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						filterModel={filterModel}
						onFilterModelChange={setFilterModel}
						onCustomFilterParamsChange={setCustomFilterParams}
						toolbar={{ quickFilter: true, debounceMs: 500 }}
					/>
				</Stack>
			</Protected>
		</NavigationBar>
	);
};

export default StoreStockOverviewClient;
