'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, Payments as PaymentsIcon } from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteExpenseMutation, useGetExpenseQuery } from '@/store/services/magasin';
import { EXPENSES_EDIT, EXPENSES_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate, formatNumber } from '@/utils/helpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';

type Props = SessionProps & { id: number };

const ExpensesViewClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const { data: expense, isLoading, error } = useGetExpenseQuery({ id }, { skip: !token });
	const [deleteExpense] = useDeleteExpenseMutation();
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);

	const handleDelete = async () => {
		try {
			await deleteExpense({ id }).unwrap();
			onSuccess(t.magasin.expenseDeleted);
			router.push(EXPENSES_LIST);
		} catch (deleteError) {
			onError(extractApiErrorMessage(deleteError, t.magasin.expenseDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	return (
		<NavigationBar title={t.magasin.expenseDetails}>
			<Protected permission="can_view">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(EXPENSES_LIST)}>{t.magasin.backToExpenses}</Button>
								{expense && (
									<Stack direction="row" spacing={1}>
										{permissions.can_create && <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => router.push(EXPENSES_EDIT(expense.id, expense.store))}>{t.common.edit}</Button>}
										{permissions.can_delete && <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>{t.common.delete}</Button>}
									</Stack>
								)}
							</Stack>
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : !expense ? <Alert severity="warning">{t.magasin.noRows}</Alert> : (
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
											<PaymentsIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>{expense.label}</Typography>
											<Chip size="small" color={expense.payment_status === 'paid' ? 'success' : 'warning'} label={expense.payment_status} />
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={1}>
											<Typography>{t.magasin.store}: {expense.store_name}</Typography>
											<Typography>{t.magasin.expenseCategory}: {expense.category_name}</Typography>
											<Typography>{t.magasin.date}: {formatDate(expense.expense_date)}</Typography>
											<Typography>{t.magasin.paymentMode}: {expense.payment_mode}</Typography>
											<Typography>{t.magasin.expenseAmount}: {formatNumber(expense.amount)} Dhs</Typography>
											<Typography>{t.magasin.responsible}: {expense.created_by_email ?? '-'}</Typography>
											<Typography>{t.magasin.note}: {expense.note || '-'}</Typography>
										</Stack>
									</CardContent>
								</Card>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
			{showDeleteModal && <ActionModals title={t.magasin.deleteExpenseTitle} body={t.magasin.deleteExpenseBody} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" actions={[{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' }, { text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' }]} />}
		</NavigationBar>
	);
};

export default ExpensesViewClient;
