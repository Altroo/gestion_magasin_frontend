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
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddStockTransferMutation, useEditStockTransferMutation, useGetProductsQuery, useGetStockTransferQuery } from '@/store/services/magasin';
import { stockTransferSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { STOCK_TRANSFERS_LIST, STOCK_TRANSFERS_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { StockTransferPayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const emptyLine = { product: '', quantity: '1' };

type TransferFormValues = {
	target_store: string;
	reference: string;
	transfer_date: string;
	status: 'draft' | 'validated' | 'cancelled' | '';
	note: string;
	lines: Array<typeof emptyLine>;
	globalError: string;
};

type Props = SessionProps & { id?: number };

const StockTransfersFormClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const { defaultStore, memberships } = useSelectedStore(token);
	const mbrStore = memberships.find((membership) => membership.store.is_global_stock)?.store ?? defaultStore;
	const targetStores = memberships.map((membership) => membership.store).filter((store) => !store.is_global_stock);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [addTransfer, addState] = useAddStockTransferMutation();
	const [editTransfer, editState] = useEditStockTransferMutation();
	const { data: transfer, isLoading: isTransferLoading, error: transferError } = useGetStockTransferQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: mbrStore?.id, page: 1, pageSize: 200 },
		{ skip: !token || !mbrStore?.id },
	);
	const axiosError = useMemo(() => (transferError ? (transferError as ResponseDataInterface<ApiErrorResponseType>) : undefined), [transferError]);

	const toPayload = (values: TransferFormValues): StockTransferPayload => ({
		store: mbrStore?.id ?? 0,
		target_store: Number(values.target_store),
		reference: values.reference.trim(),
		transfer_date: values.transfer_date,
		status: values.status || 'draft',
		note: values.note.trim(),
		lines: values.lines.map((line) => ({ product: Number(line.product), quantity: line.quantity })),
	});

	const formik = useFormik<TransferFormValues>({
		initialValues: {
			target_store: transfer?.target_store ? String(transfer.target_store) : '',
			reference: transfer?.reference ?? '',
			transfer_date: transfer?.transfer_date ?? new Date().toISOString().slice(0, 10),
			status: transfer?.status ?? 'draft',
			note: transfer?.note ?? '',
			lines: transfer?.lines.length ? transfer.lines.map((line) => ({ product: String(line.product), quantity: line.quantity })) : [{ ...emptyLine }],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(stockTransferSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			try {
				if (isEditMode) {
					const updated = await editTransfer({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.transferUpdated);
					router.push(STOCK_TRANSFERS_VIEW(updated.id));
				} else {
					const created = await addTransfer(toPayload(values)).unwrap();
					onSuccess(t.magasin.transferCreated);
					router.push(STOCK_TRANSFERS_VIEW(created.id));
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.transferUpdateError : t.magasin.transferCreateError));
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(() => ({ target_store: t.magasin.targetStore, reference: t.magasin.transferReference, transfer_date: t.magasin.transferDate, status: t.magasin.status, note: t.magasin.note, lines: t.magasin.saleLines, globalError: t.errors.globalError }), [t]);
	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) Object.entries(formik.errors).forEach(([key, value]) => { if (key !== 'globalError' && typeof value === 'string') errors[key] = value; if (key === 'lines' && value) errors.lines = t.validation.required; });
		return errors;
	}, [formik.errors, hasAttemptedSubmit, t.validation.required]);

	const addLine = () => void formik.setFieldValue('lines', [...formik.values.lines, { ...emptyLine }]);
	const removeLine = (index: number) => {
		const next = formik.values.lines.filter((_, lineIndex) => lineIndex !== index);
		void formik.setFieldValue('lines', next.length ? next : [{ ...emptyLine }]);
	};

	const isLoading = addState.isLoading || editState.isLoading || areProductsLoading || isTransferLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editStockTransfer : t.magasin.newStockTransfer}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STOCK_TRANSFERS_LIST)} sx={{ width: 'fit-content' }}>{t.magasin.backToTransfers}</Button>
							{Object.keys(validationErrors).length > 0 && <Alert severity="error" icon={<WarningIcon />}><Typography variant="subtitle2" fontWeight={600}>{t.users.validationErrorsDetected}</Typography><ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{Object.entries(validationErrors).map(([key, message]) => <li key={key}><Typography variant="body2">{getLabelForKey(fieldLabels, key)} : {message}</Typography></li>)}</ul></Alert>}
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : (axiosError?.status as number) > 400 ? <ApiAlert errorDetails={axiosError?.data.details} /> : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><StorefrontIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.stockTransferDetails}</Typography></Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.targetStore} *`} value={formik.values.target_store} onChange={(event) => void formik.setFieldValue('target_store', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="">{t.common.selectValue}</MenuItem>{targetStores.map((store) => <MenuItem key={store.id} value={String(store.id)}>{store.name}</MenuItem>)}</TextField></ThemeProvider>
													<CustomTextInput id="reference" type="text" label={t.magasin.transferReference} value={formik.values.reference} onChange={formik.handleChange('reference')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<CustomTextInput id="transfer_date" type="date" label={t.magasin.transferDate} value={formik.values.transfer_date} onChange={formik.handleChange('transfer_date')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={t.magasin.status} value={formik.values.status} onChange={(event) => void formik.setFieldValue('status', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="draft">Draft</MenuItem><MenuItem value="validated">Validated</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></TextField></ThemeProvider>
												</Box>
												<Box sx={{ mt: 2.5 }}><CustomTextInput id="note" type="text" label={t.magasin.note} value={formik.values.note} onChange={formik.handleChange('note')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} /></Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Stack direction="row" spacing={2}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography></Stack><Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>{t.common.add}</Button></Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2}>{formik.values.lines.map((line, index) => (
													<Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 160px 44px' }, gap: 2 }}>
														<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.product} *`} value={line.product} onChange={(event) => void formik.setFieldValue(`lines.${index}.product`, event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="">{t.common.selectValue}</MenuItem>{products?.results.map((product) => <MenuItem key={product.id} value={String(product.id)}>{product.reference ?? product.barcode ?? product.id} - {product.name}</MenuItem>)}</TextField></ThemeProvider>
														<CustomTextInput id={`lines.${index}.quantity`} type="number" label={t.magasin.quantity} value={line.quantity} onChange={formik.handleChange(`lines.${index}.quantity`)} fullWidth size="small" theme={inputTheme} startIcon={<NumbersIcon fontSize="small" />} />
														<IconButton color="error" onClick={() => removeLine(index)} sx={{ height: 40, width: 40 }}><CloseIcon /></IconButton>
													</Box>
												))}</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryLoadingButton type="submit" buttonText={isEditMode ? t.magasin.editStockTransfer : t.magasin.newStockTransfer} active={!addState.isLoading && !editState.isLoading} loading={addState.isLoading || editState.isLoading} startIcon={<SaveIcon />} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setHasAttemptedSubmit(true); if (!formik.isValid) { event.preventDefault(); formik.handleSubmit(); onError(t.magasin.fixValidationErrors); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`} /></Box>
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

export default StockTransfersFormClient;
