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
import { useAddPromotionMutation, useEditPromotionMutation, useGetProductsQuery, useGetPromotionQuery } from '@/store/services/magasin';
import { promotionSchema } from '@/utils/formValidationSchemas';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { PROMOTIONS_LIST, PROMOTIONS_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { PromotionPayload } from '@/types/gestionMagasinTypes';

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
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [linePaginationModel, setLinePaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });

	const { data: promotion, isLoading: isPromotionLoading, error: promotionError } = useGetPromotionQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: storeId, page: 1, pageSize: 200 },
		{ skip: !token || !storeId },
	);
	const [addPromotion, addState] = useAddPromotionMutation();
	const [editPromotion, editState] = useEditPromotionMutation();

	const error = promotionError || addState.error || editState.error;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const toPayload = (values: PromotionFormValues): PromotionPayload => ({
		store: promotion?.store ?? storeId!,
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
					router.push(PROMOTIONS_VIEW(id!, storeId));
				} else {
					const created = await addPromotion(toPayload(values)).unwrap();
					onSuccess(t.magasin.promotionCreated);
					router.push(PROMOTIONS_VIEW(created.id, storeId));
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

	const productOptions = products?.results ?? [];
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
