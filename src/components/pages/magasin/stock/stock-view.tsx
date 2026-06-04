'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	Numbers as NumbersIcon,
	Store as StoreIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteStockBalanceMutation, useGetStockBalanceQuery } from '@/store/services/magasin';
import { STOCK_EDIT, STOCK_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDateShort, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
	storeId?: number;
};

type InfoRowProps = {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue = isValidElement(value) ? value : value || '-';

	return (
		<Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.5, flexWrap: 'wrap' }}>
			<Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', minWidth: 40 }}>{icon}</Box>
			<Stack direction="row" spacing={isMobile ? 0 : 2} alignItems="center" sx={{ flex: 1, flexWrap: 'wrap' }}>
				<Typography fontWeight={600} color="text.secondary" sx={{ minWidth: { xs: '100%', sm: 220 }, wordBreak: 'break-word' }}>
					{label}
				</Typography>
				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? displayValue : <Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>}
				</Box>
			</Stack>
		</Stack>
	);
};

const StockViewClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const { data: stockBalance, isLoading, error } = useGetStockBalanceQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const [deleteStockBalance] = useDeleteStockBalanceMutation();

	const handleDelete = async () => {
		try {
			await deleteStockBalance({ id }).unwrap();
			onSuccess(t.magasin.stockDeleted);
			router.push(STOCK_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.stockDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.stockDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STOCK_LIST)}>
									{t.magasin.backToStock}
								</Button>
								{!isLoading && !error && stockBalance && (
									<Stack direction="row" gap={1} flexWrap="wrap">
										{permissions.can_edit && (
											<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(STOCK_EDIT(id, storeId))}>
												{t.common.edit}
											</Button>
										)}
										{permissions.can_delete && (
											<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
												{t.common.delete}
											</Button>
										)}
									</Stack>
								)}
							</Stack>
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : !stockBalance ? (
								<Alert severity="warning">{t.magasin.noRows}</Alert>
							) : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{stockBalance.product_name}</Typography>
											</Stack>
											<Stack direction="row" spacing={1} flexWrap="wrap">
												<Chip label={`ID: ${stockBalance.id}`} size="small" variant="outlined" />
												{stockBalance.is_low_stock ? (
													<Chip icon={<WarningIcon />} label={t.magasin.lowStock} color="warning" size="small" />
												) : (
													<Chip label={t.common.no} color="default" size="small" variant="outlined" />
												)}
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.stockInformation}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<StoreIcon />} label={t.magasin.store} value={stockBalance.store_name} />
											<Divider />
											<InfoRow icon={<InventoryIcon />} label={t.magasin.product} value={stockBalance.product_name} />
											<Divider />
											<InfoRow icon={<NumbersIcon />} label={t.magasin.reference} value={stockBalance.product_reference ?? stockBalance.product_barcode} />
											<Divider />
											<InfoRow icon={<InventoryIcon />} label={t.magasin.category} value={stockBalance.category_name} />
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<NumbersIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.stockThreshold}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<InfoRow icon={<NumbersIcon />} label={t.magasin.currentStock} value={formatNumber(stockBalance.quantity)} />
											<Divider />
											<InfoRow icon={<WarningIcon />} label={t.magasin.minimumStock} value={formatNumber(stockBalance.effective_min_stock)} />
											<Divider />
											<InfoRow icon={<NumbersIcon />} label={t.magasin.averageCost} value={`${formatNumber(stockBalance.average_cost)} Dhs`} />
											<Divider />
											<InfoRow icon={<WarningIcon />} label={t.magasin.lowStockStatus} value={stockBalance.is_low_stock ? t.magasin.lowStock : t.common.no} />
											<Divider />
											<InfoRow icon={<WarningIcon />} label={t.magasin.notifications} value={formatDateShort(stockBalance.low_stock_notified_at ?? null)} />
										</CardContent>
									</Card>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && (
				<ActionModals
					title={t.magasin.deleteStockTitle}
					body={t.magasin.deleteStockBody}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
					actions={[
						{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
						{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
					]}
				/>
			)}
		</NavigationBar>
	);
};

export default StockViewClient;
