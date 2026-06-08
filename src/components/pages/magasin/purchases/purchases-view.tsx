'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Chip, Divider, Stack } from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	AttachFile as AttachFileIcon,
	CalendarMonth as CalendarIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	DownloadDone as ReceiveIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	Numbers as NumbersIcon,
	Person as PersonIcon,
	Storefront as StorefrontIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { DetailCard, DetailHeaderCard, InfoRow, LineItemsCard, StatusChip } from '@/components/pages/magasin/shared/view-components';
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
			<Protected>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PURCHASES_LIST)}>{t.magasin.backToPurchases}</Button>
								{purchase && (
									<Stack direction="row" spacing={1}>
										{permissions.can_edit && purchase.status !== 'received' && <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => router.push(PURCHASES_EDIT(purchase.id))}>{t.common.edit}</Button>}
										{permissions.can_create && purchase.status === 'draft' && <Button variant="outlined" color="success" size="small" startIcon={<ReceiveIcon />} onClick={() => setShowReceiveModal(true)}>{t.magasin.receivePurchase}</Button>}
										{permissions.can_delete && purchase.status !== 'received' && <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>{t.common.delete}</Button>}
									</Stack>
								)}
							</Stack>
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : !purchase ? <Alert severity="warning">{t.magasin.noRows}</Alert> : (
								<Stack spacing={3}>
									<DetailHeaderCard
										icon={<StorefrontIcon />}
										title={purchase.reference || `#${purchase.id}`}
										chips={(
											<>
												<Chip label={`ID: ${purchase.id}`} size="small" variant="outlined" />
												<StatusChip t={t} status={purchase.status} />
											</>
										)}
									/>
									<DetailCard icon={<StorefrontIcon />} title={t.magasin.purchaseDetails}>
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={purchase.store_name} />
										<Divider />
										<InfoRow icon={<PersonIcon />} label={t.magasin.supplier} value={purchase.supplier_name} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.date} value={formatDate(purchase.purchase_date)} />
										<Divider />
										<InfoRow icon={<NumbersIcon />} label={t.magasin.subtotal} value={`${formatNumber(purchase.subtotal)} Dhs`} />
										<Divider />
										<InfoRow
											icon={<AttachFileIcon />}
											label={t.magasin.invoice}
											value={purchase.invoice_file_url ? (
												<Button href={purchase.invoice_file_url} target="_blank" rel="noopener noreferrer" size="small" startIcon={<AttachFileIcon />}>
													{t.magasin.invoice}
												</Button>
											) : '-'}
										/>
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={purchase.note} />
									</DetailCard>
									<DetailCard icon={<PersonIcon />} title={t.users.generalInfo}>
										<InfoRow icon={<PersonIcon />} label={t.magasin.responsible} value={purchase.created_by_email} />
										<Divider />
										<InfoRow icon={<ReceiveIcon />} label={t.magasin.received} value={purchase.received_by_email} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.users.lastUpdate} value={formatDate(purchase.date_updated ?? null)} />
									</DetailCard>
									<LineItemsCard
										icon={<InventoryIcon />}
										title={t.magasin.products}
										rows={purchase.lines}
										getRowKey={(line) => line.id}
										emptyLabel={t.magasin.noRows}
										columns={[
											{ key: 'product', label: t.magasin.product, render: (line) => `${line.product_reference ?? line.product_barcode ?? line.product} - ${line.product_name}` },
											{ key: 'quantity', label: t.magasin.quantity, align: 'right', render: (line) => formatNumber(line.quantity) },
											{ key: 'purchasePrice', label: t.magasin.purchasePrice, align: 'right', render: (line) => `${formatNumber(line.unit_cost)} Dhs` },
											{ key: 'total', label: t.magasin.total, align: 'right', render: (line) => `${formatNumber(line.total)} Dhs` },
										]}
									/>
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
