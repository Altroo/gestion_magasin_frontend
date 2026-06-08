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
									<DetailHeaderCard
										icon={<InventoryIcon />}
										title={inventory.title}
										chips={(
											<>
												<Chip label={`ID: ${inventory.id}`} size="small" variant="outlined" />
												<Chip label={inventory.code} size="small" variant="outlined" />
												<StatusChip t={t} status={inventory.status} />
											</>
										)}
									/>
									<DetailCard icon={<InventoryIcon />} title={t.magasin.inventoryDetails}>
										<InfoRow icon={<BadgeIcon />} label={t.magasin.inventoryCode} value={inventory.code} />
										<Divider />
										<InfoRow icon={<StorefrontIcon />} label={t.magasin.store} value={inventory.store_name} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.magasin.inventoryCountDate} value={formatDate(inventory.inventory_date)} />
										<Divider />
										<InfoRow icon={<DescriptionIcon />} label={t.magasin.note} value={inventory.note} />
									</DetailCard>
									<DetailCard icon={<PersonIcon />} title={t.users.generalInfo}>
										<InfoRow icon={<PersonIcon />} label={t.magasin.responsible} value={inventory.created_by_email} />
										<Divider />
										<InfoRow icon={<ValidateIcon />} label={t.magasin.validated} value={inventory.validated_by_email} />
										<Divider />
										<InfoRow icon={<CalendarIcon />} label={t.users.lastUpdate} value={formatDate(inventory.date_updated ?? null)} />
									</DetailCard>
									<LineItemsCard
										icon={<NumbersIcon />}
										title={t.magasin.products}
										rows={inventory.lines}
										getRowKey={(line) => line.id}
										emptyLabel={t.magasin.noRows}
										columns={[
											{ key: 'product', label: t.magasin.product, render: (line) => line.product_name },
											{ key: 'reference', label: t.magasin.reference, render: (line) => line.product_reference ?? line.product_barcode ?? '-' },
											{ key: 'expected', label: t.magasin.expectedQuantity, align: 'right', render: (line) => formatNumber(line.expected_quantity) },
											{ key: 'counted', label: t.magasin.countedQuantity, align: 'right', render: (line) => formatNumber(line.counted_quantity) },
											{ key: 'difference', label: t.magasin.difference, align: 'right', render: (line) => formatNumber(line.difference) },
											{ key: 'note', label: t.magasin.note, render: (line) => line.note || '-' },
										]}
									/>
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
