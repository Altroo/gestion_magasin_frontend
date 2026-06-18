'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Delete as DeleteIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	Remove as RemoveIcon,
	Storefront as StorefrontIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getIn, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { MuiFormikDatePicker } from '@/components/formikElements/muiPickers/muiPickers';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { stockWorkflowStatusOptions } from '@/components/pages/magasin/shared/status-labels';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useAddInventorySessionMutation,
	useEditInventorySessionMutation,
	useGetInventorySessionQuery,
	useGetProductsQuery,
} from '@/store/services/magasin';
import { inventorySchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { splitAutocompleteRenderParams } from '@/utils/muiAutocompleteSlots';
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

type InventoryLineGridRow = typeof emptyLine & {
	id: number;
	index: number;
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
	const [linePaginationModel, setLinePaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
	const [addInventory, addState] = useAddInventorySessionMutation();
	const [editInventory, editState] = useEditInventorySessionMutation();
	const {
		data: inventory,
		isLoading: isInventoryLoading,
		error: inventoryError,
	} = useGetInventorySessionQuery({ id: id! }, { skip: !token || !isEditMode });
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: storeId, page: 1, pageSize: 200 },
		{ skip: !token || !storeId },
	);
	const axiosError = useMemo(
		() => (inventoryError ? (inventoryError as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[inventoryError],
	);

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
			lines: inventory?.lines.length
				? inventory.lines.map((line) => ({
						product: String(line.product),
						expected_quantity: line.expected_quantity,
						counted_quantity: line.counted_quantity,
						note: line.note ?? '',
					}))
				: [{ ...emptyLine }],
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
				onError(
					extractApiErrorMessage(e, isEditMode ? t.magasin.inventoryUpdateError : t.magasin.inventoryCreateError),
				);
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			code: t.magasin.inventoryCode,
			title: t.magasin.inventoryTitle,
			inventory_date: t.magasin.inventoryCountDate,
			status: t.magasin.status,
			note: t.magasin.note,
			lines: t.magasin.inventoryLines,
			globalError: t.errors.globalError,
		}),
		[t],
	);
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
	const productOptions = products?.results ?? [];
	const productLabel = (product: { id: number; reference: string | null; barcode: string | null; name: string }) =>
		`${product.reference ?? product.barcode ?? product.id} - ${product.name}`;
	const lineError = (index: number, field: string) => {
		const error = getIn(formik.errors, `lines.${index}.${field}`);
		const touched = getIn(formik.touched, `lines.${index}.${field}`);
		return (touched || hasAttemptedSubmit) && typeof error === 'string' ? error : '';
	};
	const formatQuantityValue = (value: number) => {
		if (!Number.isFinite(value)) return '0';
		const rounded = Math.round(value * 1000) / 1000;
		return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
	};
	const updateLineQuantity = (index: number, field: 'expected_quantity' | 'counted_quantity', delta: number) => {
		const current = Number(formik.values.lines[index]?.[field] || 0);
		const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
		void formik.setFieldValue(`lines.${index}.${field}`, formatQuantityValue(next));
		void formik.setFieldTouched(`lines.${index}.${field}`, true, false);
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
	const renderQuantityStepper = (
		params: GridRenderCellParams<InventoryLineGridRow>,
		field: 'expected_quantity' | 'counted_quantity',
	) => (
		<Stack
			direction="row"
			spacing={0.5}
			sx={{
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
				height: '100%',
			}}
		>
			<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, field, -1)} aria-label="Diminuer">
				<RemoveIcon fontSize="small" />
			</IconButton>
			<Typography variant="body2" sx={{ width: 42, textAlign: 'center', fontWeight: 600 }}>
				{params.row[field] || '0'}
			</Typography>
			<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, field, 1)} aria-label="Augmenter">
				<AddIcon fontSize="small" />
			</IconButton>
		</Stack>
	);
	const lineColumns: GridColDef<InventoryLineGridRow>[] = [
		{
			field: 'product',
			headerName: t.magasin.product,
			flex: 1.5,
			minWidth: 260,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<InventoryLineGridRow>) => (
				<Box sx={{ width: '100%', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
					<Autocomplete
						size="small"
						options={productOptions}
						value={productOptions.find((product) => String(product.id) === params.row.product) ?? null}
						onChange={(_, nextProduct) =>
							void formik.setFieldValue(`lines.${params.row.index}.product`, nextProduct ? String(nextProduct.id) : '')
						}
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
			field: 'expected_quantity',
			headerName: t.magasin.expectedQuantity,
			width: 170,
			align: 'center',
			headerAlign: 'center',
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<InventoryLineGridRow>) =>
				renderQuantityStepper(params, 'expected_quantity'),
		},
		{
			field: 'counted_quantity',
			headerName: t.magasin.countedQuantity,
			width: 170,
			align: 'center',
			headerAlign: 'center',
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<InventoryLineGridRow>) =>
				renderQuantityStepper(params, 'counted_quantity'),
		},
		{
			field: 'note',
			headerName: t.magasin.note,
			flex: 1,
			minWidth: 200,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<InventoryLineGridRow>) => (
				<TextField
					type="text"
					size="small"
					placeholder={t.magasin.note}
					value={params.row.note}
					onChange={(event) => void formik.setFieldValue(`lines.${params.row.index}.note`, event.target.value)}
					onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.note`, true)}
					fullWidth
					variant="standard"
					multiline
					minRows={2}
					slotProps={{ input: { disableUnderline: true }, htmlInput: { maxLength: 2000 } }}
					sx={gridPlainInputSx}
				/>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			width: 95,
			sortable: false,
			filterable: false,
			disableColumnMenu: true,
			renderCell: (params: GridRenderCellParams<InventoryLineGridRow>) => (
				<IconButton color="error" size="small" onClick={() => removeLine(params.row.index)}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			),
		},
	];

	return (
		<NavigationBar title={isEditMode ? t.magasin.editInventory : t.magasin.newInventory}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(INVENTORY_LIST)}
								sx={{ width: 'fit-content' }}
							>
								{t.magasin.backToInventory}
							</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />}>
									<Typography
										variant="subtitle2"
										sx={{
											fontWeight: 600,
										}}
									>
										{t.users.validationErrorsDetected}
									</Typography>
									<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
										{Object.entries(validationErrors).map(([key, message]) => (
											<li key={key}>
												<Typography variant="body2">
													{getLabelForKey(fieldLabels, key)} : {message}
												</Typography>
											</li>
										))}
									</ul>
								</Alert>
							)}
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (axiosError?.status as number) > 400 ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack
													direction="row"
													spacing={2}
													sx={{
														alignItems: 'center',
														mb: 2,
													}}
												>
													<StorefrontIcon color="primary" />
													<Typography
														variant="h6"
														sx={{
															fontWeight: 700,
														}}
													>
														{t.magasin.inventoryDetails}
													</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Box
													sx={{
														display: 'grid',
														gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
														gap: 2.5,
													}}
												>
													<CustomTextInput
														id="code"
														type="text"
														label={`${t.magasin.inventoryCode} *`}
														value={formik.values.code}
														onChange={formik.handleChange('code')}
														onBlur={formik.handleBlur('code')}
														error={(formik.touched.code || hasAttemptedSubmit) && Boolean(formik.errors.code)}
														helperText={formik.touched.code || hasAttemptedSubmit ? formik.errors.code : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="title"
														type="text"
														label={`${t.magasin.inventoryTitle} *`}
														value={formik.values.title}
														onChange={formik.handleChange('title')}
														onBlur={formik.handleBlur('title')}
														error={(formik.touched.title || hasAttemptedSubmit) && Boolean(formik.errors.title)}
														helperText={formik.touched.title || hasAttemptedSubmit ? formik.errors.title : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<InventoryIcon fontSize="small" />}
													/>
													<MuiFormikDatePicker
														id="inventory_date"
														label={`${t.magasin.inventoryCountDate} *`}
														value={formik.values.inventory_date}
														onChange={(value) => void formik.setFieldValue('inventory_date', value)}
														onBlur={formik.handleBlur('inventory_date')}
														error={
															(formik.touched.inventory_date || hasAttemptedSubmit) &&
															Boolean(formik.errors.inventory_date)
														}
														helperText={
															formik.touched.inventory_date || hasAttemptedSubmit ? formik.errors.inventory_date : ''
														}
														fullWidth
														size="small"
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															label={`${t.magasin.status} *`}
															value={formik.values.status}
															onChange={(event) => void formik.setFieldValue('status', event.target.value)}
															onBlur={formik.handleBlur('status')}
															error={(formik.touched.status || hasAttemptedSubmit) && Boolean(formik.errors.status)}
															helperText={formik.touched.status || hasAttemptedSubmit ? formik.errors.status : ''}
															slotProps={{
																input: {
																	startAdornment: (
																		<InputAdornment position="start">
																			<DescriptionIcon fontSize="small" />
																		</InputAdornment>
																	),
																},
															}}
															fullWidth
														>
															{stockWorkflowStatusOptions(t).map((option) => (
																<MenuItem key={option.id} value={option.id}>
																	{option.nom}
																</MenuItem>
															))}
														</TextField>
													</ThemeProvider>
												</Box>
												<Box sx={{ mt: 2.5 }}>
													<CustomTextInput
														id="note"
														type="textarea"
														label={t.magasin.note}
														value={formik.values.note}
														onChange={formik.handleChange('note')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack
													direction="row"
													sx={{
														justifyContent: 'space-between',
														alignItems: 'center',
														mb: 2,
													}}
												>
													<Stack direction="row" spacing={2}>
														<InventoryIcon color="primary" />
														<Typography
															variant="h6"
															sx={{
																fontWeight: 700,
															}}
														>
															{t.magasin.inventoryLines}
														</Typography>
													</Stack>
													<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>
														{t.common.add}
													</Button>
												</Stack>
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
										<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={isEditMode ? t.magasin.editInventory : t.magasin.newInventory}
												active={!addState.isLoading && !editState.isLoading}
												loading={addState.isLoading || editState.isLoading}
												startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
												onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
													setHasAttemptedSubmit(true);
													if (!formik.isValid) {
														event.preventDefault();
														formik.handleSubmit();
														onError(t.magasin.fixValidationErrors);
														window.scrollTo({ top: 0, behavior: 'smooth' });
													}
												}}
												cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
											/>
										</Box>
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
