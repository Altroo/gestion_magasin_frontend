'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Cancel as CancelIcon,
	CheckCircle as CheckCircleIcon,
	PendingActions as PendingActionsIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import TooltipTextCell from '@/components/shared/dataGridCells/tooltipTextCell';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetPaymentModesQuery, useGetSalesQuery } from '@/store/services/magasin';
import { SALES_ADD, SALES_VIEW } from '@/utils/routes';
import { formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission } from '@/utils/hooks';
import type { SessionProps } from '@/types/_initTypes';
import type { SaleType } from '@/types/gestionMagasinTypes';

const roleCanCreateSale = (role?: string) => role === 'direction' || role === 'responsable' || role === 'vendeur';

const SalesClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { defaultStore, memberships } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
	const storeId = selectedStoreId ?? defaultStore?.id;
	const selectedMembership = memberships.find((membership) => membership.store.id === storeId);
	const canCreateSale = roleCanCreateSale(selectedMembership?.role.code);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});

	const { data, isLoading } = useGetSalesQuery(
		{
			store: storeId,
			search: searchTerm,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			...customFilterParams,
			...chipFilterParams,
		},
		{ skip: !token || !storeId },
	);
	const { data: paymentModes } = useGetPaymentModesQuery({ page: 1, pageSize: 100, is_active: 'true' }, { skip: !token });

	const statusOptions = [
		{ value: 'confirmed', label: t.magasin.confirmed },
		{ value: 'void', label: t.magasin.voided },
	];
	const paymentStatusOptions = [
		{ value: 'paid', label: t.magasin.paid },
		{ value: 'credit', label: t.magasin.credit },
	];
	const chipFilters = useMemo(
		() => [
			{
				key: 'status',
				label: t.magasin.status,
				paramName: 'status',
				options: [
					{ id: 'confirmed', nom: magasinStatusLabel(t, 'confirmed') },
					{ id: 'void', nom: magasinStatusLabel(t, 'void') },
				],
			},
			{
				key: 'payment_status',
				label: t.magasin.paymentStatus,
				paramName: 'payment_status',
				options: [
					{ id: 'paid', nom: magasinStatusLabel(t, 'paid') },
					{ id: 'credit', nom: magasinStatusLabel(t, 'credit') },
				],
			},
			{
				key: 'payment_mode',
				label: t.magasin.paymentMode,
				paramName: 'payment_mode',
				options: (paymentModes?.results ?? []).map((mode) => ({ id: String(mode.id), nom: mode.name })),
			},
		],
		[paymentModes?.results, t],
	);

	const renderStatusChip = (status?: string | null) => {
		const label = magasinStatusLabel(t, status);
		if (status === 'confirmed' || status === 'paid') {
			return <DarkTooltip title={label}><Chip size="small" color="success" variant="outlined" icon={<CheckCircleIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		if (status === 'void') {
			return <DarkTooltip title={label}><Chip size="small" color="error" variant="outlined" icon={<CancelIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		if (status === 'credit') {
			return <DarkTooltip title={label}><Chip size="small" color="warning" variant="outlined" icon={<PendingActionsIcon fontSize="small" />} label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
		}
		return <DarkTooltip title={label}><Chip size="small" color="default" variant="outlined" label={label} sx={{ fontWeight: 600 }} /></DarkTooltip>;
	};

	const columns: GridColDef[] = [
		{
			field: 'date_created',
			headerName: t.magasin.date,
			flex: 1.1,
			minWidth: 160,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<SaleType>) => (
				<TooltipTextCell>{formatDate(params.value as string)}</TooltipTextCell>
			),
		},
		{
			field: 'seller_email',
			headerName: t.magasin.seller,
			flex: 1.2,
			minWidth: 160,
			renderCell: (params: GridRenderCellParams<SaleType>) => (
				<DarkTooltip title={params.value ?? '-'}>
					<Typography variant="body2" noWrap>{params.value ?? '-'}</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'payment_mode_name',
			headerName: t.magasin.paymentMode,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<SaleType>) => (
				<TooltipTextCell>{params.value ?? '-'}</TooltipTextCell>
			),
		},
		{
			field: 'payment_status',
			headerName: t.magasin.paymentStatus,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createDropdownFilterOperators(paymentStatusOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<SaleType>) => renderStatusChip(params.value as string),
		},
		{
			field: 'status',
			headerName: t.magasin.status,
			flex: 0.8,
			minWidth: 120,
			filterOperators: createDropdownFilterOperators(statusOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<SaleType>) => renderStatusChip(params.value as string),
		},
		{
			field: 'total',
			headerName: t.magasin.total,
			flex: 0.9,
			minWidth: 130,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<SaleType>) => (
				<TooltipTextCell title={`${formatNumber(params.value as string)} Dhs`} color="primary" fontWeight={600}>
					{formatNumber(params.value as string)} Dhs
				</TooltipTextCell>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 0.7,
			minWidth: 110,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<SaleType>) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <VisibilityIcon />,
							onClick: () => router.push(SALES_VIEW(params.row.id, storeId)),
							color: 'info',
							show: permissions.can_view,
						},
					]}
				/>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.sales}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs
						selectedStoreId={storeId}
						onChange={(nextStoreId) => {
							setSelectedStoreId(nextStoreId);
							setPaginationModel((current) => ({ ...current, page: 0 }));
						}}
						token={token}
					/>
					<Box sx={magasinPageContentSx}>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{permissions.can_create && canCreateSale && (
								<Button variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => router.push(SALES_ADD(storeId))}>
									{t.magasin.newSale}
								</Button>
							)}
						</Stack>
					</Box>
					<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={2} />
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
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default SalesClient;
