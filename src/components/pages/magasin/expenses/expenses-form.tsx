'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, MenuItem, Stack, TextField, ThemeProvider, Typography, useTheme } from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Category as CategoryIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Payments as PaymentsIcon,
	Storefront as StorefrontIcon,
	Subject as RemarkIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { MuiFormikDatePicker } from '@/components/formikElements/muiPickers/muiPickers';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { expensePaymentModeOptions, expensePaymentStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useAddExpenseMutation,
	useAddExpenseCategoryMutation,
	useDeleteExpenseCategoryMutation,
	useEditExpenseMutation,
	useEditExpenseCategoryMutation,
	useGetExpenseCategoriesQuery,
	useGetExpenseQuery,
	useGetPaymentModesQuery,
} from '@/store/services/magasin';
import { expenseSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { EXPENSES_LIST, EXPENSES_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { ExpensePayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type ExpenseFormValues = {
	category: string;
	label: string;
	amount: string;
	payment_status: 'paid' | 'payable' | '';
	payment_mode: 'cash' | 'card' | 'transfer' | 'other' | '';
	expense_date: string;
	note: string;
	globalError: string;
};

type Props = SessionProps & { id?: number; storeId?: number };

const ExpensesFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const theme = useTheme();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [addExpense, addState] = useAddExpenseMutation();
	const [editExpense, editState] = useEditExpenseMutation();
	const [addExpenseCategory] = useAddExpenseCategoryMutation();
	const [editExpenseCategory] = useEditExpenseCategoryMutation();
	const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();
	const { data: expense, isLoading: isExpenseLoading, error: expenseError } = useGetExpenseQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: categories, isLoading: areCategoriesLoading } = useGetExpenseCategoriesQuery(
		{ page: 1, pageSize: 100 },
		{ skip: !token },
	);
	const { data: paymentModes, isLoading: arePaymentModesLoading } = useGetPaymentModesQuery(
		{ page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token },
	);
	const axiosError = useMemo(() => (expenseError ? (expenseError as ResponseDataInterface<ApiErrorResponseType>) : undefined), [expenseError]);
	const paymentModeOptions = useMemo(() => expensePaymentModeOptions(t, paymentModes?.results), [paymentModes?.results, t]);
	const defaultPaymentMode = paymentModeOptions.find((mode) => mode.id === 'cash') ?? paymentModeOptions[0];
	const categoryItems = useMemo(
		() => (categories?.results ?? []).map((category) => ({ code: String(category.id), value: category.name })),
		[categories?.results],
	);

	const toPayload = (values: ExpenseFormValues): ExpensePayload => ({
		store: storeId ?? expense?.store ?? 0,
		category: Number(values.category),
		label: values.label.trim(),
		amount: values.amount,
		payment_status: values.payment_status || 'payable',
		payment_mode: values.payment_mode || 'cash',
		expense_date: values.expense_date,
		note: values.note.trim(),
	});

	const formik = useFormik<ExpenseFormValues>({
		initialValues: {
			category: expense?.category ? String(expense.category) : '',
			label: expense?.label ?? '',
			amount: expense?.amount ?? '',
			payment_status: expense?.payment_status ?? 'payable',
			payment_mode: expense?.payment_mode ?? (defaultPaymentMode?.id as ExpenseFormValues['payment_mode'] | undefined) ?? '',
			expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
			note: expense?.note ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(expenseSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			try {
				if (isEditMode) {
					const updated = await editExpense({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.expenseUpdated);
					router.push(EXPENSES_VIEW(updated.id, updated.store));
				} else {
					const created = await addExpense(toPayload(values)).unwrap();
					onSuccess(t.magasin.expenseCreated);
					router.push(EXPENSES_VIEW(created.id, created.store));
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.expenseUpdateError : t.magasin.expenseCreateError));
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(() => ({
		category: t.magasin.expenseCategory,
		label: t.magasin.expenseLabel,
		amount: t.magasin.expenseAmount,
		payment_status: t.magasin.paymentStatus,
		payment_mode: t.magasin.paymentMode,
		expense_date: t.magasin.date,
		note: t.magasin.movementNote,
		globalError: t.errors.globalError,
	}), [t]);
	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) Object.entries(formik.errors).forEach(([key, value]) => { if (key !== 'globalError' && typeof value === 'string') errors[key] = value; });
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);
	const fieldError = (field: keyof ExpenseFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const selectedCategory = categoryItems.find((category) => category.code === formik.values.category) ?? null;
	const categoryError = (formik.touched.category || hasAttemptedSubmit) && Boolean(formik.errors.category);

	const isLoading = addState.isLoading || editState.isLoading || isExpenseLoading || areCategoriesLoading || arePaymentModesLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editExpense : t.magasin.newExpense}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(EXPENSES_LIST)} sx={{ width: 'fit-content' }}>{t.magasin.backToExpenses}</Button>
							{Object.keys(validationErrors).length > 0 && <Alert severity="error" icon={<WarningIcon />}><Typography variant="subtitle2" fontWeight={600}>{t.users.validationErrorsDetected}</Typography><ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{Object.entries(validationErrors).map(([key, message]) => <li key={key}><Typography variant="body2">{getLabelForKey(fieldLabels, key)} : {message}</Typography></li>)}</ul></Alert>}
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><StorefrontIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.expenseDetails}</Typography></Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<CustomAutoCompleteSelect
														id="category"
														size="small"
														noOptionsText={t.common.noOptions}
														label={`${t.magasin.expenseCategory} *`}
														items={categoryItems}
														theme={theme}
														value={selectedCategory}
														fullWidth
														onChange={(_, nextCategory) => void formik.setFieldValue('category', nextCategory ? nextCategory.code : '')}
														onBlur={formik.handleBlur('category')}
														error={categoryError}
														helperText={(formik.touched.category || hasAttemptedSubmit) ? formik.errors.category : ''}
														startIcon={<CategoryIcon fontSize="small" />}
														endIcon={
															<EntityCrudControls
																label={t.magasin.expenseCategory.toLowerCase()}
																icon={<CategoryIcon fontSize="small" />}
																inputTheme={inputTheme}
																selectedItem={selectedCategory}
																addEntity={(data) => addExpenseCategory(data).unwrap()}
																editEntity={({ id: entityId, data }) => editExpenseCategory({ id: entityId, data }).unwrap()}
																deleteEntity={({ id: entityId }) => deleteExpenseCategory({ id: entityId }).unwrap()}
																onAddSuccess={(newId) => void formik.setFieldValue('category', String(newId))}
																onDeleteSuccess={() => void formik.setFieldValue('category', '')}
															/>
														}
													/>
													<CustomTextInput id="label" type="text" label={`${t.magasin.expenseLabel} *`} value={formik.values.label} onChange={formik.handleChange('label')} onBlur={formik.handleBlur('label')} error={Boolean(fieldError('label'))} helperText={fieldError('label')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<CustomTextInput id="amount" type="number" label={`${t.magasin.expenseAmount} *`} value={formik.values.amount} onChange={formik.handleChange('amount')} onBlur={formik.handleBlur('amount')} error={Boolean(fieldError('amount'))} helperText={fieldError('amount')} fullWidth size="small" theme={inputTheme} startIcon={<PaymentsIcon fontSize="small" />} />
													<MuiFormikDatePicker id="expense_date" label={`${t.magasin.date} *`} value={formik.values.expense_date} onChange={(value) => void formik.setFieldValue('expense_date', value)} onBlur={formik.handleBlur('expense_date')} error={Boolean(fieldError('expense_date'))} helperText={fieldError('expense_date')} fullWidth size="small" startIcon={<DescriptionIcon fontSize="small" />} />
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.paymentStatus} *`} value={formik.values.payment_status} onChange={(event) => void formik.setFieldValue('payment_status', event.target.value)} onBlur={formik.handleBlur('payment_status')} error={Boolean(fieldError('payment_status'))} helperText={fieldError('payment_status')} InputProps={{ startAdornment: <InputAdornment position="start"><PaymentsIcon fontSize="small" /></InputAdornment> }} fullWidth>{expensePaymentStatusOptions(t).map((option) => <MenuItem key={option.id} value={option.id}>{option.nom}</MenuItem>)}</TextField></ThemeProvider>
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.paymentMode} *`} value={formik.values.payment_mode} onChange={(event) => void formik.setFieldValue('payment_mode', event.target.value)} onBlur={formik.handleBlur('payment_mode')} error={Boolean(fieldError('payment_mode'))} helperText={fieldError('payment_mode')} InputProps={{ startAdornment: <InputAdornment position="start"><PaymentsIcon fontSize="small" /></InputAdornment> }} fullWidth>{paymentModeOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.nom}</MenuItem>)}</TextField></ThemeProvider>
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<RemarkIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.movementNote}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<CustomTextInput
													id="note"
													type="text"
													label={t.magasin.movementNote}
													value={formik.values.note}
													onChange={formik.handleChange('note')}
													onBlur={formik.handleBlur('note')}
													error={Boolean(fieldError('note'))}
													helperText={fieldError('note')}
													fullWidth
													size="small"
													theme={inputTheme}
													startIcon={<RemarkIcon fontSize="small" />}
												/>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryLoadingButton type="submit" buttonText={isEditMode ? t.magasin.editExpense : t.magasin.newExpense} active={!addState.isLoading && !editState.isLoading} loading={addState.isLoading || editState.isLoading} startIcon={isEditMode ? <EditIcon /> : <AddIcon />} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setHasAttemptedSubmit(true); if (!formik.isValid) { event.preventDefault(); formik.handleSubmit(); onError(t.magasin.fixValidationErrors); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`} /></Box>
									</Stack>
								</form>
							)}
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default ExpensesFormClient;
