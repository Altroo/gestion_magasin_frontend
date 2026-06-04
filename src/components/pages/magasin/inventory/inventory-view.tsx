'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, CheckCircle as ValidateIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Inventory2 as InventoryIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { magasinStatusLabel } from '@/components/pages/magasin/shared/status-labels';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteInventorySessionMutation, useGetInventorySessionQuery, useValidateInventorySessionMutation } from '@/store/services/magasin';
import { INVENTORY_EDIT, INVENTORY_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & { id: number };

const InventoryViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showValidateModal, setShowValidateModal] = useState(false);
	const { data: inventory, isLoading, error, refetch } = useGetInventorySessionQuery({ id }, { skip: !token });
	const [deleteInventory] = useDeleteInventorySessionMutation();
	const [validateInventory] = useValidateInventorySessionMutation();
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const handleDelete = async () => {
		try {
			await deleteInventory({ id }).unwrap();
			onSuccess(t.magasin.inventoryDeleted);
			router.push(INVENTORY_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.inventoryDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const handleValidate = async () => {
		try {
			await validateInventory({ id }).unwrap();
			onSuccess(t.magasin.inventoryValidated);
			refetch();
		} catch (validateError) {
			onError(extractApiErrorMessage(validateError, t.magasin.inventoryValidateError));
		} finally {
			setShowValidateModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.inventoryDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(INVENTORY_LIST)}>{t.magasin.backToInventory}</Button>
								{inventory && (
									<Stack direction="row" spacing={1}>
										{permissions.can_create && inventory.status === 'draft' && <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => router.push(INVENTORY_EDIT(inventory.id, inventory.store))}>{t.common.edit}</Button>}
										{permissions.can_create && inventory.status === 'draft' && <Button variant="outlined" color="success" size="small" startIcon={<ValidateIcon />} onClick={() => setShowValidateModal(true)}>{t.magasin.validateInventory}</Button>}
										{permissions.can_delete && inventory.status !== 'validated' && <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>{t.common.delete}</Button>}
									</Stack>
								)}
							</Stack>
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : !inventory ? <Alert severity="warning">{t.magasin.noRows}</Alert> : (
								<Stack spacing={3}>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
												<InventoryIcon color="primary" />
												<Typography variant="h6" fontWeight={700}>{inventory.title}</Typography>
												<Chip size="small" color={inventory.status === 'validated' ? 'success' : 'default'} label={magasinStatusLabel(t, inventory.status)} />
											</Stack>
											<Divider sx={{ mb: 2 }} />
											<Stack spacing={1}>
												<Typography>{t.magasin.inventoryCode}: {inventory.code}</Typography>
												<Typography>{t.magasin.store}: {inventory.store_name}</Typography>
												<Typography>{t.magasin.date}: {formatDate(inventory.inventory_date)}</Typography>
												<Typography>{t.magasin.responsible}: {inventory.created_by_email ?? '-'}</Typography>
												<Typography>{t.magasin.note}: {inventory.note || '-'}</Typography>
											</Stack>
										</CardContent>
									</Card>
									<Card elevation={2} sx={{ borderRadius: 2 }}>
										<CardContent sx={{ p: 3 }}>
											<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography></Stack>
											<Divider sx={{ mb: 2 }} />
											<Table size="small">
												<TableHead><TableRow><TableCell>{t.magasin.product}</TableCell><TableCell>{t.magasin.reference}</TableCell><TableCell align="right">{t.magasin.expectedQuantity}</TableCell><TableCell align="right">{t.magasin.countedQuantity}</TableCell><TableCell align="right">{t.magasin.difference}</TableCell><TableCell>{t.magasin.note}</TableCell></TableRow></TableHead>
												<TableBody>{inventory.lines.map((line) => <TableRow key={line.id}><TableCell>{line.product_name}</TableCell><TableCell>{line.product_reference ?? line.product_barcode ?? '-'}</TableCell><TableCell align="right">{formatNumber(line.expected_quantity)}</TableCell><TableCell align="right">{formatNumber(line.counted_quantity)}</TableCell><TableCell align="right">{formatNumber(line.difference)}</TableCell><TableCell>{line.note || '-'}</TableCell></TableRow>)}</TableBody>
											</Table>
										</CardContent>
									</Card>
								</Stack>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && <ActionModals title={t.magasin.deleteInventoryTitle} body={t.magasin.deleteInventoryBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
			{showValidateModal && <ActionModals title={t.magasin.validateInventory} body={t.magasin.inventoryDetails} titleIcon={<ValidateIcon />} titleIconColor="#2E7D32" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowValidateModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.magasin.validateInventory, active: true, onClick: handleValidate, icon: <ValidateIcon />, color: '#2E7D32' }]} />}
		</NavigationBar>
	);
};

export default InventoryViewClient;
