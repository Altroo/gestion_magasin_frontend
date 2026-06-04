'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Card,
	CardContent,
	Checkbox,
	Divider,
	FormControlLabel,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
	useMediaQuery,
	useTheme,
	Button,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Category as CategoryIcon,
	CheckCircle as CheckCircleIcon,
	CreditCard as CreditCardIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Event as EventIcon,
	Fingerprint as FingerprintIcon,
	Inventory2 as InventoryIcon,
	QrCodeScanner as QrCodeScannerIcon,
	Save as SaveIcon,
	Straighten as StraightenIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useAddProductMutation, useEditProductMutation, useGetCategoriesQuery, useGetProductQuery } from '@/store/services/magasin';
import { CATALOG_LIST, CATALOG_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { productSchema } from '@/utils/formValidationSchemas';
import { useLanguage, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { ProductFormValues, ProductPayload } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type Props = SessionProps & {
	id?: number;
	storeId?: number;
};

const toPayload = (values: ProductFormValues): ProductPayload => ({
	reference: values.reference.trim() || null,
	barcode: values.barcode.trim() || null,
	name: values.name.trim(),
	category: values.category ? Number(values.category) : null,
	unit: values.unit.trim(),
	purchase_price: values.purchase_price,
	wholesale_price: values.wholesale_price,
	detail_price: values.detail_price,
	counter_price: values.counter_price,
	default_stock_alert: values.default_stock_alert,
	expiration_date: values.expiration_date || null,
	shelf_life_days: values.shelf_life_days ? Number(values.shelf_life_days) : null,
	compliance_required: values.compliance_required,
	is_active: values.is_active,
});

const CatalogFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
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

	const { data: product, isLoading: isProductLoading, error: productError } = useGetProductQuery(
		{ id: id!, store: storeId },
		{ skip: !token || !isEditMode || !storeId },
	);
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !token });
	const [addProduct, addState] = useAddProductMutation();
	const [editProduct, editState] = useEditProductMutation();

	const error = productError || addState.error || editState.error;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const formik = useFormik<ProductFormValues>({
		initialValues: {
			reference: product?.reference ?? '',
			barcode: product?.barcode ?? '',
			name: product?.name ?? '',
			category: product?.category ? String(product.category) : '',
			unit: product?.unit ?? 'unité',
			purchase_price: product?.purchase_price ?? '0',
			wholesale_price: product?.wholesale_price ?? '0',
			detail_price: product?.detail_price ?? '0',
			counter_price: product?.counter_price ?? '0',
			default_stock_alert: product?.default_stock_alert ?? '0',
			expiration_date: product?.expiration_date ?? '',
			shelf_life_days: product?.shelf_life_days ? String(product.shelf_life_days) : '',
			compliance_required: product?.compliance_required ?? false,
			is_active: product?.is_active ?? true,
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(productSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode) {
					await editProduct({ id: id!, store: storeId, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.productUpdated);
					router.push(CATALOG_VIEW(id!, storeId));
				} else {
					await addProduct({ store: storeId, data: toPayload(values) }).unwrap();
					onSuccess(t.magasin.productCreated);
					router.push(CATALOG_LIST);
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, isEditMode ? t.magasin.productUpdateError : t.magasin.productCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			reference: t.magasin.reference,
			barcode: t.magasin.barcodeValue,
			name: t.magasin.product,
			category: t.magasin.category,
			unit: t.magasin.unit,
			purchase_price: t.magasin.purchasePrice,
			wholesale_price: t.magasin.wholesalePrice,
			detail_price: t.magasin.detailPrice,
			counter_price: t.magasin.counterPrice,
			default_stock_alert: t.magasin.defaultStockAlert,
			expiration_date: t.magasin.expirationDate,
			shelf_life_days: t.magasin.shelfLifeDays,
			compliance_required: t.magasin.complianceRequired,
			is_active: t.magasin.activeProduct,
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
			});
		}
		return errors;
	}, [formik.errors, hasAttemptedSubmit]);

	const isLoading = isPending || addState.isLoading || editState.isLoading || (isEditMode && isProductLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editProduct : t.magasin.newProduct}>
			<Protected permission={isEditMode ? 'can_edit' : 'can_create'}>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CATALOG_LIST)}>
									{t.magasin.backToCatalog}
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
													<DescriptionIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.productInformation}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2.5}>
													<CustomTextInput
														id="reference"
														type="text"
														label={t.magasin.reference}
														value={formik.values.reference}
														onChange={formik.handleChange('reference')}
														onBlur={formik.handleBlur('reference')}
														error={formik.touched.reference && Boolean(formik.errors.reference)}
														helperText={formik.touched.reference ? formik.errors.reference : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<FingerprintIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="barcode"
														type="text"
														label={t.magasin.barcodeValue}
														value={formik.values.barcode}
														onChange={formik.handleChange('barcode')}
														onBlur={formik.handleBlur('barcode')}
														error={formik.touched.barcode && Boolean(formik.errors.barcode)}
														helperText={formik.touched.barcode ? formik.errors.barcode : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<QrCodeScannerIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="name"
														type="text"
														label={`${t.magasin.product} *`}
														value={formik.values.name}
														onChange={formik.handleChange('name')}
														onBlur={formik.handleBlur('name')}
														error={formik.touched.name && Boolean(formik.errors.name)}
														helperText={formik.touched.name ? formik.errors.name : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															id="category"
															label={t.magasin.category}
															value={formik.values.category}
															onChange={(event) => void formik.setFieldValue('category', event.target.value)}
															onBlur={formik.handleBlur('category')}
															error={formik.touched.category && Boolean(formik.errors.category)}
															helperText={formik.touched.category ? formik.errors.category : ''}
															InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon fontSize="small" /></InputAdornment> }}
															fullWidth
														>
															<MenuItem value="">{t.common.selectValue}</MenuItem>
															{categories?.results.map((category) => (
																<MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>
															))}
														</TextField>
													</ThemeProvider>
													<CustomTextInput
														id="unit"
														type="text"
														label={`${t.magasin.unit} *`}
														value={formik.values.unit}
														onChange={formik.handleChange('unit')}
														onBlur={formik.handleBlur('unit')}
														error={formik.touched.unit && Boolean(formik.errors.unit)}
														helperText={formik.touched.unit ? formik.errors.unit : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<StraightenIcon fontSize="small" />}
													/>
												</Stack>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<CreditCardIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.pricing}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
													{[
														['purchase_price', t.magasin.purchasePrice],
														['wholesale_price', t.magasin.wholesalePrice],
														['detail_price', t.magasin.detailPrice],
														['counter_price', t.magasin.counterPrice],
													].map(([field, label]) => (
														<CustomTextInput
															key={field}
															id={field}
															type="number"
															label={`${label} *`}
															value={formik.values[field as keyof ProductFormValues] as string}
															onChange={formik.handleChange(field)}
															onBlur={formik.handleBlur(field)}
															error={Boolean(formik.touched[field as keyof ProductFormValues] && formik.errors[field as keyof ProductFormValues])}
															helperText={formik.touched[field as keyof ProductFormValues] ? (formik.errors[field as keyof ProductFormValues] as string) : ''}
															fullWidth
															size="small"
															theme={inputTheme}
															startIcon={<CreditCardIcon fontSize="small" />}
														/>
													))}
												</Box>
											</CardContent>
										</Card>
										<Card elevation={2} sx={{ borderRadius: 2 }}>
											<CardContent sx={{ p: 3 }}>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													<InventoryIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.stockSettings}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2.5}>
													<CustomTextInput
														id="default_stock_alert"
														type="number"
														label={`${t.magasin.defaultStockAlert} *`}
														value={formik.values.default_stock_alert}
														onChange={formik.handleChange('default_stock_alert')}
														onBlur={formik.handleBlur('default_stock_alert')}
														error={formik.touched.default_stock_alert && Boolean(formik.errors.default_stock_alert)}
														helperText={formik.touched.default_stock_alert ? formik.errors.default_stock_alert : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<InventoryIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="expiration_date"
														type="date"
														label={t.magasin.expirationDate}
														value={formik.values.expiration_date}
														onChange={formik.handleChange('expiration_date')}
														onBlur={formik.handleBlur('expiration_date')}
														error={formik.touched.expiration_date && Boolean(formik.errors.expiration_date)}
														helperText={formik.touched.expiration_date ? formik.errors.expiration_date : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<EventIcon fontSize="small" />}
														shrink
													/>
													<CustomTextInput
														id="shelf_life_days"
														type="number"
														label={t.magasin.shelfLifeDays}
														value={formik.values.shelf_life_days}
														onChange={formik.handleChange('shelf_life_days')}
														onBlur={formik.handleBlur('shelf_life_days')}
														error={formik.touched.shelf_life_days && Boolean(formik.errors.shelf_life_days)}
														helperText={formik.touched.shelf_life_days ? formik.errors.shelf_life_days : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<EventIcon fontSize="small" />}
													/>
													<FormControlLabel
														control={<Checkbox checked={formik.values.compliance_required} onChange={formik.handleChange} name="compliance_required" />}
														label={<Stack direction="row" spacing={1} alignItems="center"><WarningIcon fontSize="small" /> <Typography>{t.magasin.complianceRequired}</Typography></Stack>}
													/>
													<FormControlLabel
														control={<Checkbox checked={formik.values.is_active} onChange={formik.handleChange} name="is_active" />}
														label={<Stack direction="row" spacing={1} alignItems="center"><CheckCircleIcon fontSize="small" /> <Typography>{t.magasin.activeProduct}</Typography></Stack>}
													/>
												</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={isEditMode ? t.magasin.editProduct : t.magasin.newProduct}
												active={!isPending}
												loading={isPending}
												startIcon={isEditMode ? <EditIcon /> : <SaveIcon />}
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

export default CatalogFormClient;
