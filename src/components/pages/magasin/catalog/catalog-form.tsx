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
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
	Button,
} from '@mui/material';
import {
	Add as AddIcon,
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
	Straighten as StraightenIcon,
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
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useAddCategoryMutation,
	useAddProductMutation,
	useAddProductUnitMutation,
	useDeleteCategoryMutation,
	useDeleteProductUnitMutation,
	useEditCategoryMutation,
	useEditProductMutation,
	useEditProductUnitMutation,
	useGetCategoriesQuery,
	useGetProductQuery,
	useGetProductUnitsQuery,
} from '@/store/services/magasin';
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
	barcode: values.barcode.trim(),
	name: values.name.trim(),
	category: values.category ? Number(values.category) : null,
	unit: Number(values.unit),
	purchase_price: values.purchase_price,
	wholesale_price: values.wholesale_price,
	detail_price: values.detail_price,
	counter_price: values.counter_price,
	default_stock_alert: values.default_stock_alert,
	expiration_date: values.expiration_date || null,
	requires_expiration_date: values.requires_expiration_date,
	shelf_life_days: values.shelf_life_days ? Number(values.shelf_life_days) : null,
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

	const {
		data: product,
		isLoading: isProductLoading,
		error: productError,
	} = useGetProductQuery({ id: id!, store: storeId }, { skip: !token || !isEditMode || !storeId });
	const { data: categories } = useGetCategoriesQuery(undefined, { skip: !token });
	const { data: units } = useGetProductUnitsQuery(undefined, { skip: !token });
	const [addCategory] = useAddCategoryMutation();
	const [editCategory] = useEditCategoryMutation();
	const [deleteCategory] = useDeleteCategoryMutation();
	const [addProductUnit] = useAddProductUnitMutation();
	const [editProductUnit] = useEditProductUnitMutation();
	const [deleteProductUnit] = useDeleteProductUnitMutation();
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
			unit: product?.unit ? String(product.unit) : '',
			purchase_price: product?.purchase_price ?? '',
			wholesale_price: product?.wholesale_price ?? '',
			detail_price: product?.detail_price ?? '',
			counter_price: product?.counter_price ?? '',
			default_stock_alert: product?.default_stock_alert ?? '',
			expiration_date: product?.expiration_date ?? '',
			requires_expiration_date: product?.requires_expiration_date ?? false,
			shelf_life_days: product?.shelf_life_days ? String(product.shelf_life_days) : '',
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
			requires_expiration_date: t.magasin.expirationTracking,
			shelf_life_days: t.magasin.shelfLifeDays,
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
	const categoryOptions = useMemo(() => categories?.results ?? [], [categories?.results]);
	const unitOptions = useMemo(() => units?.results ?? [], [units?.results]);
	const categoryItems = useMemo(
		() => categoryOptions.map((category) => ({ code: String(category.id), value: category.name })),
		[categoryOptions],
	);
	const unitItems = useMemo(
		() => unitOptions.map((unit) => ({ code: String(unit.id), value: unit.name })),
		[unitOptions],
	);
	const selectedCategory = categoryItems.find((category) => category.code === formik.values.category) ?? null;
	const selectedUnit = unitItems.find((unit) => unit.code === formik.values.unit) ?? null;
	const fieldError = (field: keyof ProductFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const categoryError = (formik.touched.category || hasAttemptedSubmit) && Boolean(formik.errors.category);
	const unitError = (formik.touched.unit || hasAttemptedSubmit) && Boolean(formik.errors.unit);
	const expirationLabel = formik.values.requires_expiration_date
		? `${t.magasin.expirationDate} *`
		: t.magasin.expirationDate;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editProduct : t.magasin.newProduct}>
			<Protected permission={isEditMode ? 'can_edit' : 'can_create'}>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack
								direction={isMobile ? 'column' : 'row'}
								spacing={2}
								sx={{
									justifyContent: 'space-between',
								}}
							>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CATALOG_LIST)}>
									{t.magasin.backToCatalog}
								</Button>
							</Stack>
							{Object.keys(validationErrors).length > 0 && (
								<Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
									<Typography
										variant="subtitle2"
										sx={{
											fontWeight: 600,
										}}
									>
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
												<Stack
													direction="row"
													spacing={2}
													sx={{
														alignItems: 'center',
														mb: 2,
													}}
												>
													<DescriptionIcon color="primary" />
													<Typography
														variant="h6"
														sx={{
															fontWeight: 700,
														}}
													>
														{t.magasin.productInformation}
													</Typography>
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
														error={Boolean(fieldError('reference'))}
														helperText={fieldError('reference')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<FingerprintIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="barcode"
														type="text"
														label={`${t.magasin.barcodeValue} *`}
														value={formik.values.barcode}
														onChange={formik.handleChange('barcode')}
														onBlur={formik.handleBlur('barcode')}
														error={Boolean(fieldError('barcode'))}
														helperText={fieldError('barcode')}
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
														error={Boolean(fieldError('name'))}
														helperText={fieldError('name')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
													<CustomAutoCompleteSelect
														id="category"
														size="small"
														noOptionsText={t.common.noOptions}
														label={`${t.magasin.category} *`}
														items={categoryItems}
														theme={dropdownTheme}
														value={selectedCategory}
														fullWidth
														onChange={(_, nextCategory) =>
															void formik.setFieldValue('category', nextCategory ? nextCategory.code : '')
														}
														onBlur={formik.handleBlur('category')}
														error={categoryError}
														helperText={formik.touched.category || hasAttemptedSubmit ? formik.errors.category : ''}
														startIcon={<CategoryIcon fontSize="small" />}
														endIcon={
															<EntityCrudControls
																label={t.magasin.category.toLowerCase()}
																icon={<CategoryIcon fontSize="small" />}
																inputTheme={inputTheme}
																selectedItem={selectedCategory}
																addEntity={(data) => addCategory(data).unwrap()}
																editEntity={({ id: entityId, data }) => editCategory({ id: entityId, data }).unwrap()}
																deleteEntity={({ id: entityId }) => deleteCategory({ id: entityId }).unwrap()}
																onAddSuccess={(newId) => void formik.setFieldValue('category', String(newId))}
																onDeleteSuccess={() => void formik.setFieldValue('category', '')}
															/>
														}
													/>
													<CustomAutoCompleteSelect
														id="unit"
														size="small"
														noOptionsText={t.common.noOptions}
														label={`${t.magasin.unit} *`}
														items={unitItems}
														theme={dropdownTheme}
														value={selectedUnit}
														fullWidth
														onChange={(_, nextUnit) => void formik.setFieldValue('unit', nextUnit ? nextUnit.code : '')}
														onBlur={formik.handleBlur('unit')}
														error={unitError}
														helperText={formik.touched.unit || hasAttemptedSubmit ? formik.errors.unit : ''}
														startIcon={<StraightenIcon fontSize="small" />}
														endIcon={
															<EntityCrudControls
																label={t.magasin.unit.toLowerCase()}
																icon={<StraightenIcon fontSize="small" />}
																inputTheme={inputTheme}
																selectedItem={selectedUnit}
																addEntity={(data) => addProductUnit(data).unwrap()}
																editEntity={({ id: entityId, data }) =>
																	editProductUnit({ id: entityId, data }).unwrap()
																}
																deleteEntity={({ id: entityId }) => deleteProductUnit({ id: entityId }).unwrap()}
																onAddSuccess={(newId) => void formik.setFieldValue('unit', String(newId))}
																onDeleteSuccess={() => void formik.setFieldValue('unit', '')}
															/>
														}
													/>
												</Stack>
											</CardContent>
										</Card>
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
													<CreditCardIcon color="primary" />
													<Typography
														variant="h6"
														sx={{
															fontWeight: 700,
														}}
													>
														{t.magasin.pricing}
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
															error={Boolean(fieldError(field as keyof ProductFormValues))}
															helperText={fieldError(field as keyof ProductFormValues)}
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
												<Stack
													direction="row"
													spacing={2}
													sx={{
														alignItems: 'center',
														mb: 2,
													}}
												>
													<InventoryIcon color="primary" />
													<Typography
														variant="h6"
														sx={{
															fontWeight: 700,
														}}
													>
														{t.magasin.stockSettings}
													</Typography>
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
														error={Boolean(fieldError('default_stock_alert'))}
														helperText={fieldError('default_stock_alert')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<InventoryIcon fontSize="small" />}
													/>
													<MuiFormikDatePicker
														id="expiration_date"
														label={expirationLabel}
														value={formik.values.expiration_date}
														onChange={(value) => void formik.setFieldValue('expiration_date', value)}
														onBlur={formik.handleBlur('expiration_date')}
														error={Boolean(fieldError('expiration_date'))}
														helperText={fieldError('expiration_date')}
														fullWidth
														size="small"
														startIcon={<EventIcon fontSize="small" />}
													/>
													<FormControlLabel
														control={
															<Checkbox
																checked={formik.values.requires_expiration_date}
																onChange={formik.handleChange}
																name="requires_expiration_date"
															/>
														}
														label={
															<Stack
																direction="row"
																spacing={1}
																sx={{
																	alignItems: 'center',
																}}
															>
																<EventIcon fontSize="small" /> <Typography>{t.magasin.expirationTracking}</Typography>
															</Stack>
														}
													/>
													<CustomTextInput
														id="shelf_life_days"
														type="number"
														label={t.magasin.shelfLifeDays}
														value={formik.values.shelf_life_days}
														onChange={formik.handleChange('shelf_life_days')}
														onBlur={formik.handleBlur('shelf_life_days')}
														error={Boolean(fieldError('shelf_life_days'))}
														helperText={fieldError('shelf_life_days')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<EventIcon fontSize="small" />}
													/>
													<FormControlLabel
														control={
															<Checkbox
																checked={formik.values.is_active}
																onChange={formik.handleChange}
																name="is_active"
															/>
														}
														label={
															<Stack
																direction="row"
																spacing={1}
																sx={{
																	alignItems: 'center',
																}}
															>
																<CheckCircleIcon fontSize="small" /> <Typography>{t.magasin.activeProduct}</Typography>
															</Stack>
														}
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

export default CatalogFormClient;
