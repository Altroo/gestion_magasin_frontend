'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, CheckCircle as ValidateIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Inventory2 as InventoryIcon, SwapHoriz as TransferIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
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
			<Protected permission="can_view">
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
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
												<TransferIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{transfer.reference || `#${transfer.id}`}</Typography>
												<Chip size="small" color={transfer.status === 'validated' ? 'success' : 'default'} label={transfer.status} />
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Stack spacing={1}>
												<Typography>{t.magasin.sourceStore}: {transfer.source_store_name}</Typography>
												<Typography>{t.magasin.targetStore}: {transfer.target_store_name}</Typography>
												<Typography>{t.magasin.transferDate}: {formatDate(transfer.transfer_date)}</Typography>
												<Typography>{t.magasin.note}: {transfer.note || '-'}</Typography>
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography></Stack>
											<Divider sx={{ mb: 2 }} />
											<Table size="small">
												<TableHead><TableRow><TableCell>{t.magasin.product}</TableCell><TableCell>{t.magasin.reference}</TableCell><TableCell align="right">{t.magasin.quantity}</TableCell></TableRow></TableHead>
												<TableBody>{transfer.lines.map((line) => <TableRow key={line.id}><TableCell>{line.product_name}</TableCell><TableCell>{line.product_reference ?? line.product_barcode ?? '-'}</TableCell><TableCell align="right">{formatNumber(line.quantity)}</TableCell></TableRow>)}</TableBody>
											</Table>
										</CardContent>
									</Card>
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
