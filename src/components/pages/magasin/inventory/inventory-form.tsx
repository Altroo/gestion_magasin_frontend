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
import { stockWorkflowStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddInventorySessionMutation, useEditInventorySessionMutation, useGetInventorySessionQuery, useGetProductsQuery } from '@/store/services/magasin';
import { inventorySchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { INVENTORY_LIST, INVENTORY_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { InventoryPayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const emptyLine = { product: '', expected_quantity: '0', counted_quantity: '0', note: '' };

type InventoryFormValues = {
	code: string;
	title: string;
	inventory_date: string;
	status: 'draft' | 'validated' | 'cancelled' | '';
	note: string;
	lines: Array<typeof emptyLine>;
	globalError: string;
};

type Props = SessionProps & { id?: number; storeId?: number };

const InventoryFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [addInventory, addState] = useAddInventorySessionMutation();
	const [editInventory, editState] = useEditInventorySessionMutation();
	const { data: inventory, isLoading: isInventoryLoading, error: inventoryError } = useGetInventorySessionQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: storeId, page: 1, pageSize: 200 },
		{ skip: !token || !storeId },
	);
	const axiosError = useMemo(() => (inventoryError ? (inventoryError as ResponseDataInterface<ApiErrorResponseType>) : undefined), [inventoryError]);

	const toPayload = (values: InventoryFormValues): InventoryPayload => ({
		store: storeId ?? inventory?.store ?? 0,
		code: values.code.trim(),
		title: values.title.trim(),
		inventory_date: values.inventory_date,
		status: values.status || 'draft',
		note: values.note.trim(),
		lines: values.lines.map((line) => ({
			product: Number(line.product),
			expected_quantity: line.expected_quantity,
			counted_quantity: line.counted_quantity,
			note: line.note.trim(),
		})),
	});

	const formik = useFormik<InventoryFormValues>({
		initialValues: {
			code: inventory?.code ?? '',
			title: inventory?.title ?? '',
			inventory_date: inventory?.inventory_date ?? new Date().toISOString().slice(0, 10),
			status: inventory?.status ?? 'draft',
			note: inventory?.note ?? '',
			lines: inventory?.lines.length ? inventory.lines.map((line) => ({
				product: String(line.product),
				expected_quantity: line.expected_quantity,
				counted_quantity: line.counted_quantity,
				note: line.note ?? '',
			})) : [{ ...emptyLine }],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(inventorySchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			try {
				if (isEditMode) {
					const updated = await editInventory({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.inventoryUpdated);
					router.push(INVENTORY_VIEW(updated.id, updated.store));
				} else {
					const created = await addInventory(toPayload(values)).unwrap();
					onSuccess(t.magasin.inventoryCreated);
					router.push(INVENTORY_VIEW(created.id, created.store));
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.inventoryUpdateError : t.magasin.inventoryCreateError));
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(() => ({
		code: t.magasin.inventoryCode,
		title: t.magasin.inventoryTitle,
		inventory_date: t.magasin.date,
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
	const removeLine = (index: number) => {
		const next = formik.values.lines.filter((_, lineIndex) => lineIndex !== index);
		void formik.setFieldValue('lines', next.length ? next : [{ ...emptyLine }]);
	};

	const isLoading = addState.isLoading || editState.isLoading || isInventoryLoading || areProductsLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editInventory : t.magasin.newInventory}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(INVENTORY_LIST)} sx={{ width: 'fit-content' }}>{t.magasin.backToInventory}</Button>
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
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><StorefrontIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.inventoryDetails}</Typography></Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<CustomTextInput id="code" type="text" label={t.magasin.inventoryCode} value={formik.values.code} onChange={formik.handleChange('code')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<CustomTextInput id="title" type="text" label={t.magasin.inventoryTitle} value={formik.values.title} onChange={formik.handleChange('title')} fullWidth size="small" theme={inputTheme} startIcon={<InventoryIcon fontSize="small" />} />
													<CustomTextInput id="inventory_date" type="date" label={t.magasin.date} value={formik.values.inventory_date} onChange={formik.handleChange('inventory_date')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={t.magasin.status} value={formik.values.status} onChange={(event) => void formik.setFieldValue('status', event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionIcon fontSize="small" /></InputAdornment> }} fullWidth>{stockWorkflowStatusOptions(t).map((option) => <MenuItem key={option.id} value={option.id}>{option.nom}</MenuItem>)}</TextField></ThemeProvider>
												</Box>
												<Box sx={{ mt: 2.5 }}><CustomTextInput id="note" type="text" label={t.magasin.note} value={formik.values.note} onChange={formik.handleChange('note')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} /></Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Stack direction="row" spacing={2}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography></Stack><Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>{t.common.add}</Button></Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2}>{formik.values.lines.map((line, index) => (
													<Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 150px 150px 1fr 44px' }, gap: 2 }}>
														<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.product} *`} value={line.product} onChange={(event) => void formik.setFieldValue(`lines.${index}.product`, event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="small" /></InputAdornment> }} fullWidth><MenuItem value="">{t.common.selectValue}</MenuItem>{products?.results.map((product) => <MenuItem key={product.id} value={String(product.id)}>{product.reference ?? product.barcode ?? product.id} - {product.name}</MenuItem>)}</TextField></ThemeProvider>
														<CustomTextInput id={`lines.${index}.expected_quantity`} type="number" label={t.magasin.expectedQuantity} value={line.expected_quantity} onChange={formik.handleChange(`lines.${index}.expected_quantity`)} fullWidth size="small" theme={inputTheme} startIcon={<NumbersIcon fontSize="small" />} />
														<CustomTextInput id={`lines.${index}.counted_quantity`} type="number" label={t.magasin.countedQuantity} value={line.counted_quantity} onChange={formik.handleChange(`lines.${index}.counted_quantity`)} fullWidth size="small" theme={inputTheme} startIcon={<NumbersIcon fontSize="small" />} />
														<CustomTextInput id={`lines.${index}.note`} type="text" label={t.magasin.note} value={line.note} onChange={formik.handleChange(`lines.${index}.note`)} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
														<IconButton color="error" onClick={() => removeLine(index)} sx={{ height: 40, width: 40 }}><CloseIcon /></IconButton>
													</Box>
												))}</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryLoadingButton type="submit" buttonText={isEditMode ? t.magasin.editInventory : t.magasin.newInventory} active={!addState.isLoading && !editState.isLoading} loading={addState.isLoading || editState.isLoading} startIcon={<SaveIcon />} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setHasAttemptedSubmit(true); if (!formik.isValid) { event.preventDefault(); formik.handleSubmit(); onError(t.magasin.fixValidationErrors); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`} /></Box>
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

export default InventoryFormClient;
