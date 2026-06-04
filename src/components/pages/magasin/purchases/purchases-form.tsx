'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, ThemeProvider, Typography } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Close as CloseIcon, Description as DescriptionIcon, Inventory2 as InventoryIcon, Numbers as NumbersIcon, Save as SaveIcon, Storefront as StorefrontIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { purchaseStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddPurchaseMutation, useEditPurchaseMutation, useGetProductsQuery, useGetPurchaseQuery } from '@/store/services/magasin';
import { purchaseSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { PURCHASES_LIST, PURCHASES_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { PurchasePayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const emptyLine = { product: '', quantity: '1', unit_cost: '0' };

type PurchaseFormValues = {
	store: string;
	supplier_name: string;
	reference: string;
	purchase_date: string;
	status: 'draft' | 'received' | 'cancelled' | '';
	note: string;
	lines: Array<typeof emptyLine>;
	globalError: string;
};

type Props = SessionProps & { id?: number };

const PurchasesFormClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const { defaultStore, globalStore, memberships } = useSelectedStore(token);
	const storeOptions = useMemo(() => {
		const options = [globalStore, ...memberships.map((membership) => membership.store)].filter(Boolean);
		return options.filter((store, index, stores) => stores.findIndex((candidate) => candidate?.id === store?.id) === index);
	}, [globalStore, memberships]);
	const defaultPurchaseStore = globalStore ?? defaultStore;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [addPurchase, addState] = useAddPurchaseMutation();
	const [editPurchase, editState] = useEditPurchaseMutation();
	const { data: purchase, isLoading: isPurchaseLoading, error: purchaseError } = useGetPurchaseQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: defaultPurchaseStore?.id, page: 1, pageSize: 200 },
		{ skip: !token || !defaultPurchaseStore?.id },
	);
	const axiosError = useMemo(() => (purchaseError ? (purchaseError as ResponseDataInterface<ApiErrorResponseType>) : undefined), [purchaseError]);

	const toPayload = (values: PurchaseFormValues): PurchasePayload => ({
		store: Number(values.store),
		supplier_name: values.supplier_name.trim(),
		reference: values.reference.trim(),
		purchase_date: values.purchase_date,
		status: values.status || 'draft',
		note: values.note.trim(),
		lines: values.lines.map((line) => ({ product: Number(line.product), quantity: line.quantity, unit_cost: line.unit_cost })),
	});

	const formik = useFormik<PurchaseFormValues>({
		initialValues: {
			store: purchase?.store ? String(purchase.store) : defaultPurchaseStore?.id ? String(defaultPurchaseStore.id) : '',
			supplier_name: purchase?.supplier_name ?? '',
			reference: purchase?.reference ?? '',
			purchase_date: purchase?.purchase_date ?? new Date().toISOString().slice(0, 10),
			status: purchase?.status ?? 'draft',
			note: purchase?.note ?? '',
			lines: purchase?.lines.length ? purchase.lines.map((line) => ({ product: String(line.product), quantity: line.quantity, unit_cost: line.unit_cost })) : [{ ...emptyLine }],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(purchaseSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			try {
				if (isEditMode) {
					const updated = await editPurchase({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.purchaseUpdated);
					router.push(PURCHASES_VIEW(updated.id));
				} else {
					const created = await addPurchase(toPayload(values)).unwrap();
					onSuccess(t.magasin.purchaseCreated);
					router.push(PURCHASES_VIEW(created.id));
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.purchaseUpdateError : t.magasin.purchaseCreateError));
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(() => ({
		supplier_name: t.magasin.supplier,
		store: t.magasin.store,
		reference: t.magasin.reference,
		purchase_date: t.magasin.date,
		status: t.magasin.status,
		note: t.magasin.note,
		lines: t.magasin.saleLines,
		globalError: t.errors.globalError,
	}), [t]);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') errors[key] = value;
				if (key === 'lines' && value) errors.lines = t.validation.required;
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit, t.validation.required]);

	const addLine = () => void formik.setFieldValue('lines', [...formik.values.lines, { ...emptyLine }]);
	const removeLine = (index: number) => void formik.setFieldValue('lines', formik.values.lines.filter((_, lineIndex) => lineIndex !== index).length ? formik.values.lines.filter((_, lineIndex) => lineIndex !== index) : [{ ...emptyLine }]);

	const isLoading = addState.isLoading || editState.isLoading || areProductsLoading || isPurchaseLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editPurchase : t.magasin.newPurchase}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PURCHASES_LIST)} sx={{ width: 'fit-content' }}>{t.magasin.backToPurchases}</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />}>
									<Typography variant="subtitle2" fontWeight={600}>{t.users.validationErrorsDetected}</Typography>
									<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{Object.entries(validationErrors).map(([key, message]) => <li key={key}><Typography variant="body2">{getLabelForKey(fieldLabels, key)} : {message}</Typography></li>)}</ul>
								</Alert>
							)}
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><StorefrontIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.purchaseDetails}</Typography></Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.store} *`} value={formik.values.store} onChange={(event) => void formik.setFieldValue('store', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="">{t.common.selectValue}</MenuItem>{storeOptions.map((store) => <MenuItem key={store!.id} value={String(store!.id)}>{store!.name}</MenuItem>)}</TextField></ThemeProvider>
													<CustomTextInput id="supplier_name" type="text" label={t.magasin.supplier} value={formik.values.supplier_name} onChange={formik.handleChange('supplier_name')} fullWidth size="small" theme={inputTheme} startIcon={<StorefrontIcon fontSize="small" />} />
													<CustomTextInput id="reference" type="text" label={t.magasin.reference} value={formik.values.reference} onChange={formik.handleChange('reference')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<CustomTextInput id="purchase_date" type="date" label={t.magasin.date} value={formik.values.purchase_date} onChange={formik.handleChange('purchase_date')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<ThemeProvider theme={dropdownTheme}>
														<TextField select size="small" label={t.magasin.status} value={formik.values.status} onChange={(event) => void formik.setFieldValue('status', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionIcon fontSize="small" /></InputAdornment> }} fullWidth>
															{purchaseStatusOptions(t).map((option) => <MenuItem key={option.id} value={option.id}>{option.nom}</MenuItem>)}
														</TextField>
													</ThemeProvider>
												</Box>
												<Box sx={{ mt: 2.5 }}><CustomTextInput id="note" type="text" label={t.magasin.note} value={formik.values.note} onChange={formik.handleChange('note')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} /></Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Stack direction="row" spacing={2}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography></Stack><Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>{t.common.add}</Button></Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2}>{formik.values.lines.map((line, index) => (
													<Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 150px 150px 44px' }, gap: 2 }}>
														<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.product} *`} value={line.product} onChange={(event) => void formik.setFieldValue(`lines.${index}.product`, event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="">{t.common.selectValue}</MenuItem>{products?.results.map((product) => <MenuItem key={product.id} value={String(product.id)}>{product.reference ?? product.barcode ?? product.id} - {product.name}</MenuItem>)}</TextField></ThemeProvider>
														<CustomTextInput id={`lines.${index}.quantity`} type="number" label={t.magasin.quantity} value={line.quantity} onChange={formik.handleChange(`lines.${index}.quantity`)} fullWidth size="small" theme={inputTheme} startIcon={<NumbersIcon fontSize="small" />} />
														<CustomTextInput id={`lines.${index}.unit_cost`} type="number" label={t.magasin.purchasePrice} value={line.unit_cost} onChange={formik.handleChange(`lines.${index}.unit_cost`)} fullWidth size="small" theme={inputTheme} startIcon={<NumbersIcon fontSize="small" />} />
														<IconButton color="error" onClick={() => removeLine(index)} sx={{ height: 40, width: 40 }}><CloseIcon /></IconButton>
													</Box>
												))}</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryLoadingButton type="submit" buttonText={isEditMode ? t.magasin.editPurchase : t.magasin.newPurchase} active={!addState.isLoading && !editState.isLoading} loading={addState.isLoading || editState.isLoading} startIcon={<SaveIcon />} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setHasAttemptedSubmit(true); if (!formik.isValid) { event.preventDefault(); formik.handleSubmit(); onError(t.magasin.fixValidationErrors); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`} /></Box>
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

export default PurchasesFormClient;
