'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon, Delete as DeleteIcon, DownloadDone as ReceiveIcon, Edit as EditIcon, Inventory2 as InventoryIcon, Storefront as StorefrontIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeletePurchaseMutation, useGetPurchaseQuery, useReceivePurchaseMutation } from '@/store/services/magasin';
import { PURCHASES_EDIT, PURCHASES_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & {
	id: number;
};

const PurchasesViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showReceiveModal, setShowReceiveModal] = useState(false);
	const { data: purchase, isLoading, error, refetch } = useGetPurchaseQuery({ id }, { skip: !token });
	const [deletePurchase] = useDeletePurchaseMutation();
	const [receivePurchase] = useReceivePurchaseMutation();
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const handleDelete = async () => {
		try {
			await deletePurchase({ id }).unwrap();
			onSuccess(t.magasin.purchaseDeleted);
			router.push(PURCHASES_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.purchaseDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const handleReceive = async () => {
		try {
			await receivePurchase({ id }).unwrap();
			onSuccess(t.magasin.purchaseReceived);
			refetch();
		} catch (receiveError) {
			onError(extractApiErrorMessage(receiveError, t.magasin.purchaseReceiveError));
		} finally {
			setShowReceiveModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.purchaseDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PURCHASES_LIST)}>{t.magasin.backToPurchases}</Button>
								{purchase && (
									<Stack direction="row" spacing={1}>
										{permissions.can_create && purchase.status === 'draft' && <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => router.push(PURCHASES_EDIT(purchase.id))}>{t.common.edit}</Button>}
										{permissions.can_create && purchase.status === 'draft' && <Button variant="outlined" color="success" size="small" startIcon={<ReceiveIcon />} onClick={() => setShowReceiveModal(true)}>{t.magasin.receivePurchase}</Button>}
										{permissions.can_delete && purchase.status !== 'received' && <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>{t.common.delete}</Button>}
									</Stack>
								)}
							</Stack>
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : !purchase ? <Alert severity="warning">{t.magasin.noRows}</Alert> : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
												<StorefrontIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{purchase.reference || `#${purchase.id}`}</Typography>
												<Chip size="small" color={purchase.status === 'received' ? 'success' : 'default'} label={magasinStatusLabel(t, purchase.status)} />
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Stack spacing={1}>
												<Typography>{t.magasin.store}: {purchase.store_name}</Typography>
												<Typography>{t.magasin.supplier}: {purchase.supplier_name || '-'}</Typography>
												<Typography>{t.magasin.date}: {formatDate(purchase.purchase_date)}</Typography>
												<Typography>{t.magasin.subtotal}: {formatNumber(purchase.subtotal)} Dhs</Typography>
												<Typography>{t.magasin.note}: {purchase.note || '-'}</Typography>
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography>
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Table size="small">
												<TableHead>
													<TableRow><TableCell>{t.magasin.product}</TableCell><TableCell align="right">{t.magasin.quantity}</TableCell><TableCell align="right">{t.magasin.purchasePrice}</TableCell><TableCell align="right">{t.magasin.total}</TableCell></TableRow>
												</TableHead>
												<TableBody>
													{purchase.lines.map((line) => <TableRow key={line.id}><TableCell>{line.product_reference ?? line.product_barcode ?? line.product} - {line.product_name}</TableCell><TableCell align="right">{formatNumber(line.quantity)}</TableCell><TableCell align="right">{formatNumber(line.unit_cost)} Dhs</TableCell><TableCell align="right">{formatNumber(line.total)} Dhs</TableCell></TableRow>)}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && <ActionModals title={t.magasin.deletePurchaseTitle} body={t.magasin.deletePurchaseBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{showReceiveModal && <ActionModals title={t.magasin.receivePurchase} body={t.magasin.purchaseDetails} titleIcon={<ReceiveIcon />} titleIconColor="#2E7D32" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowReceiveModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.magasin.receivePurchase, active: true, onClick: handleReceive, icon: <ReceiveIcon />, color: '#2E7D32' }]} />}
		</NavigationBar>
	);
};

export default PurchasesViewClient;
