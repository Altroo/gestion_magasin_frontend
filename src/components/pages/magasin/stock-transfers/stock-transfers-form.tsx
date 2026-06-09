'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Autocomplete, Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, ThemeProvider, Typography } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon, Description as DescriptionIcon, Edit as EditIcon, Inventory2 as InventoryIcon, Remove as RemoveIcon, Storefront as StorefrontIcon, Warning as WarningIcon } from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getIn, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { MuiFormikDatePicker } from '@/components/formikElements/muiPickers/muiPickers';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import RoundedAutocomplete from '@/components/formikElements/roundedAutocomplete/roundedAutocomplete';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { stockWorkflowStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddStockTransferMutation, useEditStockTransferMutation, useGetProductsQuery, useGetStockTransferQuery } from '@/store/services/magasin';
import { stockTransferSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { splitAutocompleteRenderParams } from '@/utils/muiAutocompleteSlots';
import { STOCK_TRANSFERS_LIST, STOCK_TRANSFERS_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { ProductType, StockTransferPayload } from '@/types/gestionMagasinTypes';

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

type TransferLineGridRow = typeof emptyLine & {
	id: number;
	index: number;
};

type Props = SessionProps & { id?: number };

const StockTransfersFormClient = ({ session, id }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const router = useRouter();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const { defaultStore, globalStore, memberships } = useSelectedStore(token);
	const mbrStore = globalStore ?? defaultStore;
	const targetStores = memberships.map((membership) => membership.store).filter((store) => !store.is_global_stock);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [linePaginationModel, setLinePaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
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

	const fieldLabels = useMemo<Record<string, string>>(() => ({
		target_store: t.magasin.targetStore,
		reference: t.magasin.transferReference,
		transfer_date: t.magasin.transferDate,
		status: t.magasin.status,
		note: t.magasin.note,
		lines: t.magasin.stockTransferLines,
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

	const isLoading = addState.isLoading || editState.isLoading || areProductsLoading || isTransferLoading;
	const productOptions = products?.results ?? [];
	const selectedTargetStore = targetStores.find((store) => String(store.id) === formik.values.target_store) ?? null;
	const productLabel = (product: Pick<ProductType, 'id' | 'reference' | 'barcode' | 'name'>) =>
		`${product.reference ?? product.barcode ?? product.id} - ${product.name}`;
	const fieldError = (field: keyof TransferFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const lineError = (index: number, field: keyof typeof emptyLine) => {
		const error = getIn(formik.errors, `lines.${index}.${field}`);
		const touched = getIn(formik.touched, `lines.${index}.${field}`);
		return (touched || hasAttemptedSubmit) && typeof error === 'string' ? error : '';
	};
	const formatQuantityValue = (value: number) => {
		if (!Number.isFinite(value)) return '0';
		const rounded = Math.round(value * 1000) / 1000;
		return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
	};
	const updateLineQuantity = (index: number, delta: number) => {
		const current = Number(formik.values.lines[index]?.quantity || 0);
		const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
		void formik.setFieldValue(`lines.${index}.quantity`, formatQuantityValue(next));
		void formik.setFieldTouched(`lines.${index}.quantity`, true, false);
	};
	const lineRows = formik.values.lines.map((line, index) => ({ id: index + 1, index, ...line }));
	const gridPlainInputSx = {
		'& .MuiInputBase-root': {
			fontFamily: 'Poppins',
			fontSize: '14px',
		},
		'& .MuiInputBase-input': {
			py: 0,
		},
		'& .MuiInputBase-input::placeholder': {
			opacity: 0.7,
		},
	};
	const lineColumns: GridColDef<TransferLineGridRow>[] = [
		{
			field: 'product',
			headerName: t.magasin.product,
			flex: 1.5,
			minWidth: 260,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<TransferLineGridRow>) => (
				<Box sx={{ width: '100%', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
					<Autocomplete
						size="small"
						options={productOptions}
						value={productOptions.find((product) => String(product.id) === params.row.product) ?? null}
						onChange={(_, nextProduct) => void formik.setFieldValue(`lines.${params.row.index}.product`, nextProduct ? String(nextProduct.id) : '')}
						onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.product`, true)}
						getOptionLabel={productLabel}
						isOptionEqualToValue={(option, value) => option.id === value.id}
						noOptionsText={t.common.noOptions}
						sx={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							'& .MuiFormControl-root': {
								width: '100%',
							},
							'& .MuiInputBase-root': {
								alignItems: 'center',
							},
							'& .MuiAutocomplete-endAdornment': {
								top: '50%',
								transform: 'translateY(-50%)',
							},
						}}
						renderInput={(inputParams) => {
							const { textFieldParams, inputSlot, htmlInputSlot } = splitAutocompleteRenderParams(inputParams);
							return (
								<TextField
									{...textFieldParams}
									placeholder={`${t.magasin.product} *`}
									error={Boolean(lineError(params.row.index, 'product'))}
									variant="standard"
									slotProps={{
										input: { ...inputSlot, disableUnderline: true },
										htmlInput: htmlInputSlot,
									}}
									fullWidth
									sx={{
										...gridPlainInputSx,
										'& .MuiInputBase-input::placeholder': {
											color: lineError(params.row.index, 'product') ? 'error.main' : 'inherit',
											opacity: 0.7,
										},
									}}
								/>
							);
						}}
					/>
				</Box>
			),
		},
		{
			field: 'quantity',
			headerName: t.magasin.quantity,
			width: 170,
			align: 'center',
			headerAlign: 'center',
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<TransferLineGridRow>) => (
				<Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ width: '100%', height: '100%' }}>
					<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, -1)} aria-label="Diminuer">
						<RemoveIcon fontSize="small" />
					</IconButton>
					<Typography variant="body2" sx={{ width: 42, textAlign: 'center', fontWeight: 600, color: lineError(params.row.index, 'quantity') ? 'error.main' : 'text.primary' }}>
						{params.row.quantity || '0'}
					</Typography>
					<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, 1)} aria-label="Augmenter">
						<AddIcon fontSize="small" />
					</IconButton>
				</Stack>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			width: 95,
			sortable: false,
			filterable: false,
			disableColumnMenu: true,
			renderCell: (params: GridRenderCellParams<TransferLineGridRow>) => (
				<IconButton color="error" size="small" onClick={() => removeLine(params.row.index)}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			),
		},
	];

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
													<RoundedAutocomplete
														size="small"
														options={targetStores}
														value={selectedTargetStore}
														onChange={(_, nextStore) => void formik.setFieldValue('target_store', nextStore ? String(nextStore.id) : '')}
														onBlur={formik.handleBlur('target_store')}
														getOptionLabel={(store) => store.name}
														isOptionEqualToValue={(option, value) => option.id === value.id}
														noOptionsText={t.common.noOptions}
														label={`${t.magasin.targetStore} *`}
														error={Boolean(fieldError('target_store'))}
														helperText={fieldError('target_store')}
														startIcon={<StorefrontIcon fontSize="small" />}
														fullWidth
													/>
													<CustomTextInput id="reference" type="text" label={t.magasin.transferReference} value={formik.values.reference} onChange={formik.handleChange('reference')} onBlur={formik.handleBlur('reference')} error={Boolean(fieldError('reference'))} helperText={fieldError('reference')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
													<MuiFormikDatePicker id="transfer_date" label={`${t.magasin.transferDate} *`} value={formik.values.transfer_date} onChange={(value) => void formik.setFieldValue('transfer_date', value)} onBlur={formik.handleBlur('transfer_date')} error={Boolean(fieldError('transfer_date'))} helperText={fieldError('transfer_date')} fullWidth size="small" startIcon={<DescriptionIcon fontSize="small" />} />
													<ThemeProvider theme={dropdownTheme}><TextField select size="small" label={`${t.magasin.status} *`} value={formik.values.status} onChange={(event) => void formik.setFieldValue('status', event.target.value)} onBlur={formik.handleBlur('status')} error={Boolean(fieldError('status'))} helperText={fieldError('status')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><DescriptionIcon fontSize="small" /></InputAdornment> } }} fullWidth>{stockWorkflowStatusOptions(t).map((option) => <MenuItem key={option.id} value={option.id}>{option.nom}</MenuItem>)}</TextField></ThemeProvider>
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Stack direction="row" spacing={2}><InventoryIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.stockTransferLines}</Typography></Stack><Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>{t.common.add}</Button></Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ width: '100%' }}>
													<DataGrid
														rows={lineRows}
														columns={lineColumns}
														showToolbar
														slotProps={{
															toolbar: {
																showQuickFilter: true,
																quickFilterProps: { debounceMs: 500 },
															},
														}}
														localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
														disableRowSelectionOnClick
														paginationModel={linePaginationModel}
														onPaginationModelChange={setLinePaginationModel}
														pageSizeOptions={[5, 10, 25]}
														getRowHeight={() => 64}
														sx={{
															border: 'none',
															'& .MuiDataGrid-columnHeaderTitle': {
																fontWeight: 700,
															},
															'& .MuiDataGrid-cell': {
																display: 'flex',
																alignItems: 'center',
															},
															'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
																outline: 'none',
															},
															'& .MuiDataGrid-toolbarContainer': {
																px: 0,
																pt: 0,
																pb: 1,
															},
														}}
													/>
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}><DescriptionIcon color="primary" /><Typography variant="h6" fontWeight={700}>{t.magasin.note}</Typography></Stack>
												<Divider sx={{ mb: 3 }} />
												<CustomTextInput id="note" type="text" label={t.magasin.note} value={formik.values.note} onChange={formik.handleChange('note')} onBlur={formik.handleBlur('note')} error={Boolean(fieldError('note'))} helperText={fieldError('note')} fullWidth size="small" theme={inputTheme} startIcon={<DescriptionIcon fontSize="small" />} />
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}><PrimaryLoadingButton type="submit" buttonText={isEditMode ? t.magasin.editStockTransfer : t.magasin.newStockTransfer} active={!addState.isLoading && !editState.isLoading} loading={addState.isLoading || editState.isLoading} startIcon={isEditMode ? <EditIcon /> : <AddIcon />} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { setHasAttemptedSubmit(true); if (!formik.isValid) { event.preventDefault(); formik.handleSubmit(); onError(t.magasin.fixValidationErrors); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`} /></Box>
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
