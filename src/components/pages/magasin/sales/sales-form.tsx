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
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Inventory2 as InventoryIcon,
	ReceiptLong as ReceiptLongIcon,
	Remove as RemoveIcon,
	Storefront as StorefrontIcon,
	Subject as RemarkIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { getIn, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useCreateSaleMutation, useGetPaymentModesQuery, useGetProductsQuery, useGetPromotionsQuery } from '@/store/services/magasin';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import type { SaleCreatePayload, SaleFormLineValues, SaleFormValues } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatNumber, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { saleSchema } from '@/utils/formValidationSchemas';
import { splitAutocompleteRenderParams } from '@/utils/muiAutocompleteSlots';
import { SALES_LIST, SALES_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type Props = SessionProps & {
	storeId?: number;
};

const emptyLine = { type: 'product' as const, product: '', promotion: '', quantity: '1', unit_price: '0' };

type SaleLineGridRow = SaleFormLineValues & {
	id: number;
	index: number;
};

const firstFormikError = (value: unknown): string | undefined => {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) {
		for (const item of value) {
			const message = firstFormikError(item);
			if (message) return message;
		}
		return undefined;
	}
	if (value && typeof value === 'object') {
		for (const item of Object.values(value)) {
			const message = firstFormikError(item);
			if (message) return message;
		}
	}
	return undefined;
};

const SalesFormClient = ({ session, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { defaultStore, memberships } = useSelectedStore(token);
	const initialActiveStoreId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [linePaginationModel, setLinePaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });
	const { data: paymentModes } = useGetPaymentModesQuery(
		{ page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token },
	);
	const [createSale] = useCreateSaleMutation();

	const paymentModeOptions = paymentModes?.results ?? [];
	const defaultPaymentMode = paymentModeOptions.find((mode) => mode.code === 'cash') ?? paymentModeOptions.find((mode) => !mode.is_credit) ?? paymentModeOptions[0];

	const formik = useFormik<SaleFormValues>({
		initialValues: {
			store: initialActiveStoreId ? String(initialActiveStoreId) : '',
			payment_status: 'paid',
			payment_mode: defaultPaymentMode ? String(defaultPaymentMode.id) : '',
			paid_amount: '',
			discount_amount: '',
			note: '',
			lines: [{ ...emptyLine }],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(saleSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			const selectedStoreId = Number(values.store);
			if (!selectedStoreId) {
				onError(t.errors.genericError);
				return;
			}
			setIsPending(true);
			const payload: SaleCreatePayload = {
				store: selectedStoreId,
				payment_status: values.payment_status,
				payment_mode: Number(values.payment_mode),
				paid_amount: values.paid_amount,
				discount_amount: values.discount_amount,
				note: values.note.trim(),
				idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
				lines: values.lines
					.filter((line) => line.type === 'product')
					.map((line) => ({
						product: Number(line.product),
						quantity: line.quantity,
						unit_price: line.unit_price,
					})),
				promotion_lines: values.lines
					.filter((line) => line.type === 'promotion')
					.map((line) => ({
						promotion: Number(line.promotion),
						quantity: line.quantity,
						unit_price: line.unit_price,
					})),
			};
			try {
				const created = await createSale(payload).unwrap();
				onSuccess(t.magasin.saleCreated);
				router.push(SALES_VIEW(created.id, selectedStoreId));
			} catch (e) {
				onError(extractApiErrorMessage(e, t.magasin.saleCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});
	const activeStoreId = Number(formik.values.store || initialActiveStoreId || 0);
	const { data: products } = useGetProductsQuery(
		{ store: activeStoreId, page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token || !activeStoreId },
	);
	const { data: promotions } = useGetPromotionsQuery(
		{ store: activeStoreId, page: 1, pageSize: 100, status: 'active' },
		{ skip: !token || !activeStoreId },
	);
	const productOptions = products?.results ?? [];
	const promotionOptions = promotions?.results ?? [];

	const subtotal = useMemo(
		() =>
			formik.values.lines.reduce(
				(sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0),
				0,
			),
		[formik.values.lines],
	);
	const total = Math.max(0, subtotal - Number(formik.values.discount_amount || 0));

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			store: t.magasin.store,
			payment_status: t.magasin.paymentStatus,
			payment_mode: t.magasin.paymentMode,
			paid_amount: t.magasin.paidAmount,
			discount_amount: t.magasin.discountAmount,
			note: t.magasin.movementNote,
			lines: t.magasin.saleLines,
			globalError: t.errors.globalError,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				const errorMessage = firstFormikError(value);
				if (key !== 'globalError' && errorMessage) {
					errors[key] = errorMessage;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const getLineFieldError = (index: number, field: 'type' | 'product' | 'promotion' | 'quantity' | 'unit_price') => {
		const error = getIn(formik.errors, `lines.${index}.${field}`);
		const touched = getIn(formik.touched, `lines.${index}.${field}`);
		return (touched || hasAttemptedSubmit) && typeof error === 'string' ? error : '';
	};
	const fieldError = (field: 'store' | 'payment_status' | 'payment_mode' | 'paid_amount' | 'discount_amount' | 'note') =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? formik.errors[field]
			: '';
	const handlePaymentStatusChange = (nextStatus: 'paid' | 'in_progress' | 'cancelled') => {
		void formik.setFieldValue('payment_status', nextStatus);
		const selectedMode = paymentModeOptions.find((mode) => String(mode.id) === formik.values.payment_mode);
		if (nextStatus === 'in_progress' && !selectedMode?.is_credit) {
			const creditMode = paymentModeOptions.find((mode) => mode.is_credit);
			if (creditMode) void formik.setFieldValue('payment_mode', String(creditMode.id));
		}
		if ((nextStatus === 'paid' || nextStatus === 'cancelled') && selectedMode?.is_credit) {
			const paidMode = paymentModeOptions.find((mode) => !mode.is_credit && mode.code === 'cash') ?? paymentModeOptions.find((mode) => !mode.is_credit);
			if (paidMode) void formik.setFieldValue('payment_mode', String(paidMode.id));
		}
	};
	const handlePaymentModeChange = (paymentModeId: string) => {
		void formik.setFieldValue('payment_mode', paymentModeId);
		const selectedMode = paymentModeOptions.find((mode) => String(mode.id) === paymentModeId);
		if (selectedMode) {
			void formik.setFieldValue('payment_status', selectedMode.is_credit ? 'in_progress' : formik.values.payment_status === 'cancelled' ? 'cancelled' : 'paid');
		}
	};
	const storeItems = memberships.map((membership) => ({ code: String(membership.store.id), value: membership.store.name }));
	const selectedStore = storeItems.find((store) => store.code === formik.values.store) ?? null;

	const setLineProduct = (index: number, productId: string) => {
		const product = productOptions.find((item) => item.id === Number(productId));
		void formik.setFieldValue(`lines.${index}.type`, 'product');
		void formik.setFieldValue(`lines.${index}.product`, productId);
		void formik.setFieldValue(`lines.${index}.promotion`, '');
		if (product) {
			void formik.setFieldValue(`lines.${index}.unit_price`, product.counter_price);
		}
	};

	const setLinePromotion = (index: number, promotionId: string) => {
		const promotion = promotionOptions.find((item) => item.id === Number(promotionId));
		void formik.setFieldValue(`lines.${index}.type`, 'promotion');
		void formik.setFieldValue(`lines.${index}.promotion`, promotionId);
		void formik.setFieldValue(`lines.${index}.product`, '');
		if (promotion) {
			void formik.setFieldValue(`lines.${index}.unit_price`, promotion.selling_price);
		}
	};

	const addLine = () => {
		void formik.setFieldValue('lines', [...formik.values.lines, { ...emptyLine }]);
	};

	const removeLine = (index: number) => {
		if (formik.values.lines.length === 1) return;
		void formik.setFieldValue('lines', formik.values.lines.filter((_, lineIndex) => lineIndex !== index));
	};
	const formatQuantityValue = (value: number) => {
		if (!Number.isFinite(value)) return '0';
		const rounded = Math.round(value * 1000) / 1000;
		return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, '').replace(/\.$/, '');
	};
	const updateLineQuantity = (index: number, delta: number) => {
		const current = Number(formik.values.lines[index]?.quantity || 0);
		const next = Math.max(1, (Number.isFinite(current) ? current : 0) + delta);
		void formik.setFieldValue(`lines.${index}.quantity`, formatQuantityValue(next));
		void formik.setFieldTouched(`lines.${index}.quantity`, true, false);
	};
	const lineRows = formik.values.lines.map((line, index) => ({ id: index + 1, index, ...line }));
	const productLabel = (product: { id: number; reference: string | null; barcode: string | null; name: string }) =>
		`${product.reference ?? product.barcode ?? product.id} - ${product.name}`;
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
	const renderQuantityStepper = (params: GridRenderCellParams<SaleLineGridRow>) => (
		<Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ width: '100%', height: '100%' }}>
			<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, -1)} aria-label="Diminuer">
				<RemoveIcon fontSize="small" />
			</IconButton>
			<Typography variant="body2" sx={{ width: 42, textAlign: 'center', fontWeight: 600 }}>
				{params.row.quantity || '1'}
			</Typography>
			<IconButton size="small" onClick={() => updateLineQuantity(params.row.index, 1)} aria-label="Augmenter">
				<AddIcon fontSize="small" />
			</IconButton>
		</Stack>
	);
	const lineColumns: GridColDef<SaleLineGridRow>[] = [
		{
			field: 'type',
			headerName: t.magasin.lineType,
			width: 145,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<SaleLineGridRow>) => (
				<TextField
					select
					size="small"
					value={params.row.type}
					onChange={(event) => {
						const type = event.target.value as 'product' | 'promotion';
						void formik.setFieldValue(`lines.${params.row.index}.type`, type);
						void formik.setFieldValue(`lines.${params.row.index}.product`, '');
						void formik.setFieldValue(`lines.${params.row.index}.promotion`, '');
						void formik.setFieldValue(`lines.${params.row.index}.unit_price`, '0');
					}}
					onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.type`, true)}
					variant="standard"
					slotProps={{ input: { disableUnderline: true } }}
					fullWidth
					sx={gridPlainInputSx}
				>
					<MenuItem value="product">{t.magasin.product}</MenuItem>
					<MenuItem value="promotion">{t.magasin.promotion}</MenuItem>
				</TextField>
			),
		},
		{
			field: 'item',
			headerName: t.magasin.product,
			flex: 1.5,
			minWidth: 260,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<SaleLineGridRow>) => {
				const field = params.row.type === 'promotion' ? 'promotion' : 'product';
				const error = getLineFieldError(params.row.index, field);
				return (
					<Box sx={{ width: '100%', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
						{params.row.type === 'promotion' ? (
							<Autocomplete
								size="small"
								options={promotionOptions}
								value={promotionOptions.find((promotion) => String(promotion.id) === params.row.promotion) ?? null}
								onChange={(_, nextPromotion) => setLinePromotion(params.row.index, nextPromotion ? String(nextPromotion.id) : '')}
								onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.promotion`, true)}
								getOptionLabel={(promotion) => promotion.name}
								isOptionEqualToValue={(option, value) => option.id === value.id}
								noOptionsText={t.common.noOptions}
								sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', '& .MuiFormControl-root': { width: '100%' } }}
								renderInput={(inputParams) => {
									const { textFieldParams, inputSlot, htmlInputSlot } = splitAutocompleteRenderParams(inputParams);
									return (
										<TextField
											{...textFieldParams}
											placeholder={`${t.magasin.promotion} *`}
											error={Boolean(error)}
											variant="standard"
											slotProps={{
												input: { ...inputSlot, disableUnderline: true },
												htmlInput: htmlInputSlot,
											}}
											fullWidth
											sx={gridPlainInputSx}
										/>
									);
								}}
							/>
						) : (
							<Autocomplete
								size="small"
								options={productOptions}
								value={productOptions.find((product) => String(product.id) === params.row.product) ?? null}
								onChange={(_, nextProduct) => setLineProduct(params.row.index, nextProduct ? String(nextProduct.id) : '')}
								onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.product`, true)}
								getOptionLabel={productLabel}
								isOptionEqualToValue={(option, value) => option.id === value.id}
								noOptionsText={t.common.noOptions}
								sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', '& .MuiFormControl-root': { width: '100%' } }}
								renderInput={(inputParams) => {
									const { textFieldParams, inputSlot, htmlInputSlot } = splitAutocompleteRenderParams(inputParams);
									return (
										<TextField
											{...textFieldParams}
											placeholder={`${t.magasin.product} *`}
											error={Boolean(error)}
											variant="standard"
											slotProps={{
												input: { ...inputSlot, disableUnderline: true },
												htmlInput: htmlInputSlot,
											}}
											fullWidth
											sx={gridPlainInputSx}
										/>
									);
								}}
							/>
						)}
					</Box>
				);
			},
		},
		{
			field: 'quantity',
			headerName: t.magasin.quantity,
			width: 170,
			align: 'center',
			headerAlign: 'center',
			sortable: false,
			filterable: false,
			renderCell: renderQuantityStepper,
		},
		{
			field: 'unit_price',
			headerName: t.magasin.unitPrice,
			width: 130,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<SaleLineGridRow>) => (
				<TextField
					type="number"
					size="small"
					value={params.row.unit_price}
					onChange={(event) => void formik.setFieldValue(`lines.${params.row.index}.unit_price`, event.target.value)}
					onBlur={() => void formik.setFieldTouched(`lines.${params.row.index}.unit_price`, true)}
					variant="standard"
					slotProps={{ input: { disableUnderline: true } }}
					fullWidth
					sx={gridPlainInputSx}
				/>
			),
		},
		{
			field: 'total',
			headerName: t.magasin.total,
			width: 120,
			align: 'left',
			headerAlign: 'left',
			valueGetter: (_value, row) => Number(row.quantity || 0) * Number(row.unit_price || 0),
			renderCell: (params: GridRenderCellParams<SaleLineGridRow>) => (
				<Typography variant="body2" fontWeight={600}>
					{formatNumber(String(Number(params.row.quantity || 0) * Number(params.row.unit_price || 0)))} Dhs
				</Typography>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			width: 95,
			sortable: false,
			filterable: false,
			disableColumnMenu: true,
			renderCell: (params: GridRenderCellParams<SaleLineGridRow>) => (
				<IconButton color="error" size="small" onClick={() => removeLine(params.row.index)} aria-label={t.magasin.removeSaleLine}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			),
		},
	];

	return (
		<NavigationBar title={t.magasin.newSale}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(SALES_LIST)} sx={{ alignSelf: 'flex-start' }}>
								{t.magasin.backToSales}
							</Button>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />}>
									<Typography variant="subtitle2" fontWeight={600}>
										{t.users.validationErrorsDetected}
									</Typography>
									<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
										{Object.entries(validationErrors).map(([key, errorMessage]) => (
											<li key={key}>
												<Typography variant="body2">
													{getLabelForKey(fieldLabels, key)} : {errorMessage}
												</Typography>
											</li>
										))}
									</ul>
								</Alert>
							)}
							{isPending ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<ReceiptLongIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.saleInformation}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2.5}>
													<CustomAutoCompleteSelect
														id="store"
														size="small"
														noOptionsText={t.common.noOptions}
														label={`${t.magasin.store} *`}
														items={storeItems}
														theme={dropdownTheme}
														value={selectedStore}
														fullWidth
														onChange={(_, nextStore) => {
															void formik.setFieldValue('store', nextStore ? nextStore.code : '');
															void formik.setFieldValue('lines', [{ ...emptyLine }]);
														}}
														onBlur={formik.handleBlur('store')}
														error={Boolean(fieldError('store'))}
														helperText={fieldError('store')}
														startIcon={<StorefrontIcon fontSize="small" />}
													/>
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															id="payment_status"
															label={`${t.magasin.paymentStatus} *`}
															value={formik.values.payment_status}
															onChange={(event) => handlePaymentStatusChange(event.target.value as 'paid' | 'in_progress' | 'cancelled')}
															onBlur={formik.handleBlur('payment_status')}
															error={Boolean(fieldError('payment_status'))}
															helperText={fieldError('payment_status')}
															slotProps={{ input: { startAdornment: <InputAdornment position="start"><CreditCardIcon fontSize="small" /></InputAdornment> } }}
															fullWidth
														>
															<MenuItem value="paid">{t.magasin.paid}</MenuItem>
															<MenuItem value="in_progress">{t.magasin.inProgress}</MenuItem>
															<MenuItem value="cancelled">{t.magasin.cancelled}</MenuItem>
														</TextField>
													</ThemeProvider>
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															id="payment_mode"
															label={`${t.magasin.paymentMode} *`}
															value={formik.values.payment_mode}
															onChange={(event) => handlePaymentModeChange(event.target.value)}
															onBlur={formik.handleBlur('payment_mode')}
															error={Boolean(fieldError('payment_mode'))}
															helperText={fieldError('payment_mode')}
															slotProps={{ input: { startAdornment: <InputAdornment position="start"><CreditCardIcon fontSize="small" /></InputAdornment> } }}
															fullWidth
														>
															{paymentModeOptions.map((mode) => (
																<MenuItem key={mode.id} value={String(mode.id)}>{mode.name}</MenuItem>
															))}
														</TextField>
													</ThemeProvider>
													<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
														<CustomTextInput
															id="paid_amount"
															type="number"
															label={`${t.magasin.paidAmount} *`}
															value={formik.values.paid_amount}
															onChange={formik.handleChange('paid_amount')}
															onBlur={formik.handleBlur('paid_amount')}
															error={Boolean(fieldError('paid_amount'))}
															helperText={fieldError('paid_amount')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<CreditCardIcon fontSize="small" />}
														/>
														<CustomTextInput
															id="discount_amount"
															type="number"
															label={`${t.magasin.discountAmount} *`}
															value={formik.values.discount_amount}
															onChange={formik.handleChange('discount_amount')}
															onBlur={formik.handleBlur('discount_amount')}
															error={Boolean(fieldError('discount_amount'))}
															helperText={fieldError('discount_amount')}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<CreditCardIcon fontSize="small" />}
														/>
													</Box>
												</Stack>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
													<Stack direction="row" spacing={2} alignItems="center">
														<InventoryIcon color="primary" />
														<Typography variant="h6" fontWeight={700}>{t.magasin.saleLines}</Typography>
													</Stack>
													<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>
														{t.magasin.addSaleLine}
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
										<Card elevation={1} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={3}>
													<Typography fontWeight={600}>{t.magasin.subtotal}: {formatNumber(String(subtotal))} Dhs</Typography>
													<Typography fontWeight={700} color="primary">{t.magasin.total}: {formatNumber(String(total))} Dhs</Typography>
												</Stack>
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
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={t.magasin.newSale}
												active={!isPending}
												loading={isPending}
												startIcon={<AddIcon />}
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

export default SalesFormClient;
