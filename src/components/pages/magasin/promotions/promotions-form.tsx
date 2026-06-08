'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Divider,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	Numbers as NumbersIcon,
	Remove as RemoveIcon,
	Storefront as StorefrontIcon,
	Subject as RemarkIcon,
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
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddPromotionMutation, useEditPromotionMutation, useGetProductsQuery, useGetPromotionEligibleStoresQuery, useGetPromotionQuery, useGetStoresQuery } from '@/store/services/magasin';
import { promotionSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { PROMOTIONS_LIST, PROMOTIONS_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { PromotionEligibleStoreType, PromotionPayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type Props = SessionProps & {
	id?: number;
	storeId?: number;
};

type PromotionFormValues = {
	name: string;
	selling_price: string;
	status: 'active' | 'expired' | '';
	start_date: string;
	end_date: string;
	note: string;
	stores: string[];
	lines: Array<{ product: string; quantity: string }>;
	globalError: string;
};

const emptyLine = { product: '', quantity: '1' };

type PromotionLineGridRow = typeof emptyLine & {
	id: number;
	index: number;
};

const PromotionsFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isEditMode = id !== undefined;
	const { globalStore } = useSelectedStore(token);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [linePaginationModel, setLinePaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });

	const { data: promotion, isLoading: isPromotionLoading, error: promotionError } = useGetPromotionQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: globalStore?.id, page: 1, pageSize: 200 },
		{ skip: !token || !globalStore?.id },
	);
	const { data: storesData } = useGetStoresQuery({ pageSize: 100 }, { skip: !token || !isEditMode });
	const [addPromotion, addState] = useAddPromotionMutation();
	const [editPromotion, editState] = useEditPromotionMutation();

	const error = promotionError || addState.error || editState.error;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const toPayload = (values: PromotionFormValues): PromotionPayload => ({
		store: isEditMode ? promotion?.store ?? initialStoreId : undefined,
		stores: isEditMode ? undefined : values.stores.map(Number),
		name: values.name.trim(),
		selling_price: values.selling_price,
		status: values.status || 'active',
		start_date: values.start_date || null,
		end_date: values.end_date || null,
		note: values.note.trim(),
		lines: values.lines.map((line) => ({
			product: Number(line.product),
			quantity: line.quantity,
		})),
	});

	const formik = useFormik<PromotionFormValues>({
		initialValues: {
			name: promotion?.name ?? '',
			selling_price: promotion?.selling_price ?? '',
			status: promotion?.status ?? 'active',
			start_date: promotion?.start_date ?? '',
			end_date: promotion?.end_date ?? '',
			note: promotion?.note ?? '',
			stores: promotion?.store ? [String(promotion.store)] : [],
			lines: promotion?.lines?.length
				? promotion.lines.map((line) => ({ product: String(line.product), quantity: line.quantity }))
				: [{ ...emptyLine }],
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(promotionSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode) {
					await editPromotion({ id: id!, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.promotionUpdated);
					router.push(PROMOTIONS_VIEW(id!));
				} else {
					const response = await addPromotion(toPayload(values)).unwrap();
					const createdPromotion = 'created' in response ? response.created[0] : response;
					onSuccess('created' in response ? t.magasin.promotionCreatedForStores(response.count) : t.magasin.promotionCreated);
					router.push(createdPromotion ? PROMOTIONS_VIEW(createdPromotion.id) : PROMOTIONS_LIST);
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.promotionUpdateError : t.magasin.promotionCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			name: t.magasin.promotionName,
			selling_price: t.magasin.sellingPrice,
			status: t.magasin.status,
			start_date: t.magasin.startDate,
			end_date: t.magasin.endDate,
			note: t.magasin.note,
			stores: t.magasin.targetStores,
			lines: t.magasin.promotionLines,
			globalError: t.errors.globalError,
		}),
		[t],
	);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};
		if (hasAttemptedSubmit) {
			Object.entries(formik.errors).forEach(([key, value]) => {
				if (key !== 'globalError' && typeof value === 'string') {
					errors[key] = value;
				}
				if (key === 'lines' && value) {
					errors.lines = t.validation.required;
				}
				if (key === 'stores' && value) {
					errors.stores = t.validation.required;
				}
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit, t.validation.required]);
	const fieldError = (field: keyof PromotionFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const lineError = (index: number, field: 'product' | 'quantity') => {
		const error = getIn(formik.errors, `lines.${index}.${field}`);
		const touched = getIn(formik.touched, `lines.${index}.${field}`);
		return (touched || hasAttemptedSubmit) && typeof error === 'string' ? error : '';
	};

	const addLine = () => {
		void formik.setFieldValue('lines', [...formik.values.lines, { ...emptyLine }]);
	};

	const removeLine = (index: number) => {
		const nextLines = formik.values.lines.filter((_, lineIndex) => lineIndex !== index);
		void formik.setFieldValue('lines', nextLines.length ? nextLines : [{ ...emptyLine }]);
	};

	const productOptions = useMemo(
		() => (products?.results ?? []).filter((product) => Number(product.available_stock ?? 0) > 0),
		[products?.results],
	);
	const eligibleStoreQueryParams = useMemo(() => {
		const selectedLines = formik.values.lines.filter((line) => line.product);
		if (!selectedLines.length) return undefined;
		return {
			product_ids: selectedLines.map((line) => line.product).join(','),
			quantities: selectedLines.map((line) => line.quantity || '1').join(','),
		};
	}, [formik.values.lines]);
	const { currentData: eligibleStores, isFetching: areEligibleStoresLoading } = useGetPromotionEligibleStoresQuery(
		eligibleStoreQueryParams!,
		{ skip: !token || isEditMode || !eligibleStoreQueryParams },
	);
	const targetStoreOptions = useMemo<PromotionEligibleStoreType[]>(() => {
		if (isEditMode) {
			return (storesData?.results ?? []).map((store) => ({
				...store,
				is_eligible: true,
				missing_products: [],
			}));
		}
		return eligibleStores ?? [];
	}, [eligibleStores, isEditMode, storesData?.results]);
	const eligibleStoreIds = useMemo(
		() => new Set(targetStoreOptions.filter((store) => store.is_eligible).map((store) => String(store.id))),
		[targetStoreOptions],
	);
	const eligibleStoreIdsKey = useMemo(
		() => Array.from(eligibleStoreIds).sort().join(','),
		[eligibleStoreIds],
	);
	const selectedStoresKey = formik.values.stores.join(',');
	const storesError = fieldError('stores');
	useEffect(() => {
		if (isEditMode) return;
		if (!eligibleStoreQueryParams) {
			if (formik.values.stores.length > 0) {
				void formik.setFieldValue('stores', [], true);
			}
			return;
		}
		if (areEligibleStoresLoading && !targetStoreOptions.length) return;
		const selectedStores = selectedStoresKey ? selectedStoresKey.split(',').filter(Boolean) : [];
		const nextStores = selectedStores.filter((storeId) => eligibleStoreIds.has(storeId));
		if (nextStores.length !== formik.values.stores.length) {
			void formik.setFieldValue('stores', nextStores, true);
		}
	}, [
		areEligibleStoresLoading,
		eligibleStoreIds,
		eligibleStoreIdsKey,
		eligibleStoreQueryParams,
		formik,
		isEditMode,
		selectedStoresKey,
		targetStoreOptions.length,
	]);
	const toggleTargetStore = (store: PromotionEligibleStoreType) => {
		if (isEditMode || !store.is_eligible) return;
		const storeId = String(store.id);
		const nextStores = formik.values.stores.includes(storeId)
			? formik.values.stores.filter((idValue) => idValue !== storeId)
			: [...formik.values.stores, storeId];
		void formik.setFieldTouched('stores', true, false);
		void formik.setFieldValue('stores', nextStores, true);
	};
	const productLabel = (product: { id: number; reference: string | null; barcode: string | null; name: string }) =>
		`${product.reference ?? product.barcode ?? product.id} - ${product.name}`;
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
	const renderQuantityStepper = (params: GridRenderCellParams<PromotionLineGridRow>) => (
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
	const lineColumns: GridColDef<PromotionLineGridRow>[] = [
		{
			field: 'product',
			headerName: t.magasin.product,
			flex: 1.5,
			minWidth: 260,
			sortable: false,
			filterable: false,
			renderCell: (params: GridRenderCellParams<PromotionLineGridRow>) => {
				const error = lineError(params.row.index, 'product');
				return (
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
							sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', '& .MuiFormControl-root': { width: '100%' } }}
							renderInput={(inputParams) => (
								<TextField
									{...inputParams}
									placeholder={`${t.magasin.product} *`}
									error={Boolean(error)}
									variant="standard"
									InputProps={{ ...inputParams.InputProps, disableUnderline: true }}
									fullWidth
									sx={gridPlainInputSx}
								/>
							)}
						/>
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
			field: 'actions',
			headerName: t.common.actions,
			width: 95,
			sortable: false,
			filterable: false,
			disableColumnMenu: true,
			renderCell: (params: GridRenderCellParams<PromotionLineGridRow>) => (
				<IconButton color="error" size="small" onClick={() => removeLine(params.row.index)}>
					<DeleteIcon fontSize="small" />
				</IconButton>
			),
		},
	];

	const isLoading = isPending || addState.isLoading || editState.isLoading || areProductsLoading || (isEditMode && isPromotionLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editPromotion : t.magasin.newPromotion}>
			<Protected permission="can_create_promotion">
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PROMOTIONS_LIST)}>
									{t.magasin.backToPromotions}
								</Button>
							</Stack>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
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
							{formik.errors.globalError && <span className={Styles.errorMessage}>{formik.errors.globalError}</span>}
							{isLoading ? (
								<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
							) : shouldShowError ? (
								<ApiAlert errorDetails={axiosError?.data.details} />
							) : (
								<form onSubmit={formik.handleSubmit}>
									<Stack spacing={3}>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<LocalOfferIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.promotionDetails}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													<CustomTextInput
														id="name"
														type="text"
														label={`${t.magasin.promotionName} *`}
														value={formik.values.name}
														onChange={formik.handleChange('name')}
														onBlur={formik.handleBlur('name')}
														error={Boolean(fieldError('name'))}
														helperText={fieldError('name')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<LocalOfferIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="selling_price"
														type="number"
														label={`${t.magasin.sellingPrice} *`}
														value={formik.values.selling_price}
														onChange={formik.handleChange('selling_price')}
														onBlur={formik.handleBlur('selling_price')}
														error={Boolean(fieldError('selling_price'))}
														helperText={fieldError('selling_price')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<NumbersIcon fontSize="small" />}
													/>
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															id="status"
															label={`${t.magasin.status} *`}
															value={formik.values.status}
															onChange={(event) => void formik.setFieldValue('status', event.target.value)}
															onBlur={formik.handleBlur('status')}
															error={Boolean(fieldError('status'))}
															helperText={fieldError('status')}
															InputProps={{ startAdornment: <InputAdornment position="start"><LocalOfferIcon fontSize="small" /></InputAdornment> }}
															fullWidth
														>
															<MenuItem value="active">{t.magasin.activePromotion}</MenuItem>
															<MenuItem value="expired">{t.magasin.expiredPromotion}</MenuItem>
														</TextField>
													</ThemeProvider>
													<MuiFormikDatePicker
														id="start_date"
														label={t.magasin.startDate}
														value={formik.values.start_date}
														onChange={(value) => void formik.setFieldValue('start_date', value)}
														onBlur={formik.handleBlur('start_date')}
														error={Boolean(fieldError('start_date'))}
														helperText={fieldError('start_date')}
														fullWidth
														size="small"
														startIcon={<CalendarIcon fontSize="small" />}
													/>
													<MuiFormikDatePicker
														id="end_date"
														label={t.magasin.endDate}
														value={formik.values.end_date}
														onChange={(value) => void formik.setFieldValue('end_date', value)}
														onBlur={formik.handleBlur('end_date')}
														error={Boolean(fieldError('end_date'))}
														helperText={fieldError('end_date')}
														fullWidth
														size="small"
														startIcon={<CalendarIcon fontSize="small" />}
													/>
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
													<Stack direction="row" spacing={2} alignItems="center">
														<InventoryIcon color="primary" />
														<Typography variant="h6" fontWeight={700}>{t.magasin.promotionLines}</Typography>
													</Stack>
													<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>
														{t.common.add}
													</Button>
												</Stack>
												<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
													{t.magasin.mbrStockArticles}
												</Typography>
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
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<StorefrontIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.targetStores}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Box
													sx={{
														position: 'relative',
														border: '1px solid',
														borderColor: storesError ? 'error.main' : 'divider',
														borderRadius: '28px',
														overflow: 'hidden',
														bgcolor: 'background.paper',
													}}
												>
													<Box
														sx={{
															display: 'flex',
															alignItems: 'center',
															gap: 1.5,
															px: 2,
															py: 1.25,
															borderBottom: targetStoreOptions.length > 0 || !eligibleStoreQueryParams || areEligibleStoresLoading ? '1px solid' : 'none',
															borderColor: 'divider',
															color: storesError ? 'error.main' : 'text.secondary',
														}}
													>
														<StorefrontIcon fontSize="small" />
														<Typography variant="body2" fontWeight={600}>
															{t.magasin.selectTargetStores} *
														</Typography>
													</Box>
													{!eligibleStoreQueryParams ? (
														<Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
															{t.magasin.selectProduct}
														</Typography>
													) : areEligibleStoresLoading ? (
														<Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
															{t.common.loading}
														</Typography>
													) : targetStoreOptions.length === 0 ? (
														<Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
															{t.magasin.noEligibleStores}
														</Typography>
													) : (
														targetStoreOptions.map((store, index) => {
															const selected = formik.values.stores.includes(String(store.id));
															return (
																<Box
																	key={store.id}
																	onClick={() => toggleTargetStore(store)}
																	sx={{
																		display: 'flex',
																		alignItems: 'center',
																		gap: 1.5,
																		px: 2,
																		py: 1.5,
																		borderTop: index === 0 ? 'none' : '1px solid',
																		borderColor: 'divider',
																		cursor: store.is_eligible && !isEditMode ? 'pointer' : 'not-allowed',
																		opacity: store.is_eligible ? 1 : 0.48,
																		bgcolor: selected ? 'rgba(127, 178, 226, 0.12)' : 'background.paper',
																		transition: 'background-color 0.2s ease',
																		'&:hover': {
																			bgcolor: store.is_eligible && !isEditMode ? 'rgba(127, 178, 226, 0.08)' : 'background.paper',
																		},
																	}}
																>
																	<Checkbox
																		checked={selected}
																		disabled={!store.is_eligible || isEditMode}
																		onChange={() => toggleTargetStore(store)}
																		onClick={(event) => event.stopPropagation()}
																		sx={{ p: 0.5 }}
																	/>
																	<Box sx={{ minWidth: 0, flex: 1 }}>
																		<Typography variant="body2" fontWeight={700} noWrap>{store.name}</Typography>
																		{store.missing_products.length > 0 && (
																			<Box sx={{ mt: 0.5 }}>
																				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
																					{t.magasin.ineligibleStoreMissingProducts} :
																				</Typography>
																				{store.missing_products.map((item) => (
																					<Typography key={item.product} variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1 }}>
																						- {item.product_name}
																					</Typography>
																				))}
																			</Box>
																		)}
																	</Box>
																</Box>
															);
														})
													)}
												</Box>
												{storesError && (
													<Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
														{storesError}
													</Typography>
												)}
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
												buttonText={isEditMode ? t.magasin.editPromotion : t.magasin.newPromotion}
												active={!isPending}
												loading={isPending}
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

export default PromotionsFormClient;
