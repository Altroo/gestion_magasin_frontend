'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Chip, Divider, Stack } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarIcon,
	CheckCircle as ValidateIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	Person as PersonIcon,
	Storefront as StorefrontIcon,
	SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { DetailCard, DetailHeaderCard, InfoRow, LineItemsCard, StatusChip } from '@/components/pages/magasin/shared/view-components';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteStockTransferMutation, useGetStockTransferQuery, useValidateStockTransferMutation } from '@/store/services/magasin';
import { STOCK_TRANSFERS_EDIT, STOCK_TRANSFERS_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & { id: number };

const StockTransfersViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showValidateModal, setShowValidateModal] = useState(false);
	const { data: transfer, isLoading, error, refetch } = useGetStockTransferQuery({ id }, { skip: !token });
	const [deleteTransfer] = useDeleteStockTransferMutation();
	const [validateTransfer] = useValidateStockTransferMutation();
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const handleDelete = async () => {
		try {
			await deleteTransfer({ id }).unwrap();
			onSuccess(t.magasin.transferDeleted);
			router.push(STOCK_TRANSFERS_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.transferDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const handleValidate = async () => {
		try {
			await validateTransfer({ id }).unwrap();
			onSuccess(t.magasin.transferValidated);
			refetch();
		} catch (validateError) {
			onError(extractApiErrorMessage(validateError, t.magasin.transferValidateError));
		} finally {
			setShowValidateModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.stockTransferDetails}>
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STOCK_TRANSFERS_LIST)}>{t.magasin.backToTransfers}</Button>
								{transfer && (
									<Stack direction="row" spacing={1}>
										{permissions.can_create && transfer.status === 'draft' && <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => router.push(STOCK_TRANSFERS_EDIT(transfer.id))}>{t.common.edit}</Button>}
										{permissions.can_create && transfer.status === 'draft' && <Button variant="outlined" color="success" size="small" startIcon={<ValidateIcon />} onClick={() => setShowValidateModal(true)}>{t.common.confirm}</Button>}
										{permissions.can_delete && transfer.status !== 'validated' && <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>{t.common.delete}</Button>}
									</Stack>
								)}
							</Stack>
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : !transfer ? <Alert severity="warning">{t.magasin.noRows}</Alert> : (
								<Stack spacing={3}>
									<DetailHeaderCard
										icon={<TransferIcon />}
										title={transfer.reference || `#${transfer.id}`}
										chips={(
											<>
												<Chip label={`ID: ${transfer.id}`} size="small" variant="outlined" />
												<StatusChip t={t} status={transfer.status} />
											</>
										)}
									/>
									<DetailCard icon={<TransferIcon />} title={t.magasin.stockTransferDetails}>
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.sourceStore} value={transfer.source_store_name} />
										<Divider />
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.targetStore} value={transfer.target_store_name} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.transferDate} value={formatDate(transfer.transfer_date)} />
										<Divider />
										<InfoRow icon={<BadgeIcon />} label={t.magasin.transferReference} value={transfer.reference} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={transfer.note} />
									</DetailCard>
									<DetailCard icon={<PersonIcon />} title={t.users.generalInfo}>
										<InfoRow icon={<PersonIcon />} label={t.magasin.responsible} value={transfer.created_by_email} />
										<Divider />
										<InfoRow icon={<ValidateIcon />} label={t.magasin.validated} value={transfer.validated_by_email} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.users.lastUpdate} value={formatDate(transfer.date_updated ?? null)} />
									</DetailCard>
									<LineItemsCard
										icon={<InventoryIcon />}
										title={t.magasin.products}
										rows={transfer.lines}
										getRowKey={(line) => line.id}
										emptyLabel={t.magasin.noRows}
										columns={[
											{ key: 'product', label: t.magasin.product, render: (line) => line.product_name },
											{ key: 'reference', label: t.magasin.reference, render: (line) => line.product_reference ?? line.product_barcode ?? '-' },
											{ key: 'quantity', label: t.magasin.quantity, align: 'right', render: (line) => formatNumber(line.quantity) },
										]}
									/>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && <ActionModals title={t.magasin.deleteTransferTitle} body={t.magasin.deleteTransferBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{showValidateModal && <ActionModals title={t.common.confirm} body={t.magasin.stockTransferDetails} titleIcon={<ValidateIcon />} titleIconColor="#2E7D32" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowValidateModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.confirm, active: true, onClick: handleValidate, icon: <ValidateIcon />, color: '#2E7D32' }]} />}
		</NavigationBar>
	);
};

export default StockTransfersViewClient;
