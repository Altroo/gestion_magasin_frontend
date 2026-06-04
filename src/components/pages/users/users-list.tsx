'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography, Avatar } from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Visibility as VisibilityIcon,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
	Add as AddIcon,
	Close as CloseIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridFilterModel, GridLogicOperator } from '@mui/x-data-grid';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useDeleteUserMutation, useGetUsersListQuery, useBulkDeleteUsersMutation } from '@/store/services/account';
import { USERS_VIEW, USERS_EDIT, USERS_ADD } from '@/utils/routes';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { PaginationResponseType, SessionProps } from '@/types/_initTypes';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import type { UserClass } from '@/models/classes';
import { formatDate, extractApiErrorMessage } from '@/utils/helpers';
import { Protected } from '@/components/layouts/protected/protected';
import { useToast, useLanguage } from '@/utils/hooks';
import Image from 'next/image';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import {
	createBooleanFilterOperators,
	createDropdownFilterOperators,
} from '@/components/shared/dropdownFilter/dropdownFilter';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';

const UsersListClient: React.FC<SessionProps> = ({ session }: SessionProps) => {
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
		page: 0,
		pageSize: 10,
	});
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], logicOperator: GridLogicOperator.And });
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	// Bulk selection state
	const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

	// Call query hook at component level
	const {
		data: rawData,
		isLoading,
		refetch,
	} = useGetUsersListQuery(
		{
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm,
			...customFilterParams,
		},
		{ skip: !token },
	);
	// enforce the type of the users data
	const data = rawData as PaginationResponseType<UserClass> | undefined;

	const [deleteRecord] = useDeleteUserMutation();
	const [bulkDeleteUsers] = useBulkDeleteUsersMutation();

	const deleteHandler = async () => {
		try {
			await deleteRecord({ id: selectedUserId! }).unwrap();
			// success toast
			onSuccess(t.users.userDeletedSuccess);
			// refresh the page / data
			refetch();
		} catch (err) {
			// error toast
			onError(extractApiErrorMessage(err, t.users.userDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const showDeleteModalCall = (id: number) => {
		setSelectedUserId(id);
		setShowDeleteModal(true);
	};

	const handleSelectionChange = (ids: number[]) => {
		setSelectedUserIds(ids);
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteUsers({ ids: selectedUserIds }).unwrap();
			onSuccess(t.users.bulkUserDeletedSuccess(selectedUserIds.length));
		} catch (err) {
			onError(extractApiErrorMessage(err, t.users.userDeleteError));
		} finally {
			setSelectedUserIds([]);
			setShowBulkDeleteModal(false);
			refetch();
		}
	};

	const bulkDeleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: `${t.common.delete} (${selectedUserIds.length})`, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const genderFilterOptions = React.useMemo(
		() => [
			{ value: 'Homme', label: t.users.male },
			{ value: 'Femme', label: t.users.female },
		],
		[t],
	);

	const TrueFalseFilterOptions = React.useMemo(
		() => [
			{ value: 'true', label: t.common.yes },
			{ value: 'false', label: t.common.no },
		],
		[t],
	);

	const columns: GridColDef[] = [
		{
			field: 'avatar',
			headerName: t.users.avatar,
			flex: 0.5,
			minWidth: 70,
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const src = params.value as string | undefined | null;
				return (
					<DarkTooltip
						title={
							src ? (
								<Box sx={{ width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Image
										src={src}
										alt={params.row.first_name}
										width={260}
										height={260}
										style={{ objectFit: 'contain', display: 'block' }}
									/>
								</Box>
							) : (
								''
							)
						}
						placement="right"
						arrow
						enterDelay={100}
						leaveDelay={200}
						slotProps={{ tooltip: { sx: { pointerEvents: 'auto' } } }}
					>
						<Avatar
							src={src ?? undefined}
							alt={params.row.first_name}
							variant="rounded"
							sx={{ width: 40, height: 40 }}
						/>
					</DarkTooltip>
				);
			},
			sortable: false,
			filterable: false,
		},
		{
			field: 'first_name',
			headerName: t.users.lastName,
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'last_name',
			headerName: t.users.firstName,
			flex: 1,
			minWidth: 100,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'email',
			headerName: 'Email',
			flex: 1.5,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'gender',
			headerName: t.users.gender,
			flex: 0.7,
			minWidth: 80,
			filterOperators: createDropdownFilterOperators(genderFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<UserClass>) => (
				<DarkTooltip title={params.value}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'is_staff',
			headerName: t.users.admin,
			flex: 0.6,
			minWidth: 70,
			filterOperators: createBooleanFilterOperators(TrueFalseFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const isAdmin = Boolean(params.value);
				return (
					<DarkTooltip title={isAdmin ? t.common.yes : t.common.no}>
						{isAdmin ? (
							<CheckCircleIcon color="success" fontSize="small" />
						) : (
							<CancelIcon color="error" fontSize="small" />
						)}
					</DarkTooltip>
				);
			},
		},
		{
			field: 'is_active',
			headerName: t.users.active,
			flex: 0.6,
			minWidth: 70,
			filterOperators: createBooleanFilterOperators(TrueFalseFilterOptions, t.common.all),
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const isActive = Boolean(params.value);
				return (
					<DarkTooltip title={isActive ? t.common.yes : t.common.no}>
						{isActive ? (
							<CheckCircleIcon color="success" fontSize="small" />
						) : (
							<CancelIcon color="error" fontSize="small" />
						)}
					</DarkTooltip>
				);
			},
		},
		{
			field: 'date_joined',
			headerName: t.users.registrationDate,
			flex: 1.2,
			minWidth: 150,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const formatted = formatDate(params.value as string | null);
				return (
					<DarkTooltip title={formatted}>
						<Typography variant="body2" noWrap>
							{formatted}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'last_login',
			headerName: t.users.lastLogin,
			flex: 1.2,
			minWidth: 150,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<UserClass>) => {
				const formatted = formatDate(params.value as string | null);
				return (
					<DarkTooltip title={formatted}>
						<Typography variant="body2" noWrap>
							{formatted}
						</Typography>
					</DarkTooltip>
				);
			},
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1.5,
			minWidth: 150,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const actions = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(USERS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(USERS_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: t.common.delete,
						icon: <DeleteIcon />,
						onClick: () => showDeleteModalCall(params.row.id),
						color: 'error' as const,
					},
				];

				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title={t.navigation.usersList}>
				<Protected>
					<>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								justifyContent: 'flex-start',
								gap: 2,
								px: { xs: 1, sm: 2, md: 3 },
								mt: { xs: 1, md: 2 },
								mb: { xs: 1, md: 2 },
							}}
						>
							<Button
								variant="contained"
								onClick={() => router.push(USERS_ADD)}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
								startIcon={<AddIcon fontSize="small" />}
							>
								{t.users.newUser}
							</Button>
							{selectedUserIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{
										whiteSpace: 'nowrap',
										px: { xs: 1.5, sm: 2, md: 3 },
										py: { xs: 0.8, sm: 1, md: 1 },
										fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
									}}
								>
									{t.common.delete} ({selectedUserIds.length})
								</Button>
							)}
						</Box>

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
							checkboxSelection
							onSelectionChange={handleSelectionChange}
							selectedIds={selectedUserIds}
						/>
						{showDeleteModal && (
							<ActionModals
							title={t.users.deleteUser}
							body={t.users.deleteUserConfirm}
								actions={deleteModalActions}
								titleIcon={<DeleteIcon />}
								titleIconColor="#D32F2F"
							/>
						)}
						{showBulkDeleteModal && (
							<ActionModals
							title={t.users.deleteUsers(selectedUserIds.length)}
							body={t.users.bulkDeleteUserBody(selectedUserIds.length)}
								actions={bulkDeleteModalActions}
								titleIcon={<DeleteIcon />}
								titleIconColor="#D32F2F"
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default UsersListClient;
