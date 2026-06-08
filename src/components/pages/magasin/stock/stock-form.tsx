'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	Numbers as NumbersIcon,
	Subject as RemarkIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useAdjustStockMutation,
	useCreateStockAddRequestMutation,
	useGetProductsQuery,
	useGetStockBalanceQuery,
	useUpdateStockThresholdMutation,
} from '@/store/services/magasin';
import { STOCK_LIST, STOCK_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { extractApiErrorMessage, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { stockAdjustmentSchema, stockThresholdSchema } from '@/utils/formValidationSchemas';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import type { StockAdjustmentFormValues } from '@/types/gestionMagasinTypes';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const roleCanAdjustDirectly = (role?: string) => role === 'direction';

type Props = SessionProps & {
	id?: number;
	storeId?: number;
};

const StockFormClient = ({ session, id, storeId: initialStoreId }: Props) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const permissions = usePermission();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const isEditMode = id !== undefined;
	const { defaultStore, memberships } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const selectedMembership = memberships.find((membership) => membership.store.id === storeId);
	const canAdjustDirectly = permissions.is_staff || roleCanAdjustDirectly(selectedMembership?.role.code);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const { data: stockBalance, isLoading: isStockLoading, error: stockError } = useGetStockBalanceQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);
	const { data: products, isLoading: areProductsLoading } = useGetProductsQuery(
		{ store: storeId, page: 1, pageSize: 100 },
		{ skip: !token || !storeId },
	);
	const [adjustStock, adjustState] = useAdjustStockMutation();
	const [createStockAddRequest, requestState] = useCreateStockAddRequestMutation();
	const [updateThreshold, thresholdState] = useUpdateStockThresholdMutation();

	const error = stockError || adjustState.error || thresholdState.error || requestState.error;
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);

	const formik = useFormik<StockAdjustmentFormValues>({
		initialValues: {
			product: stockBalance?.product ? String(stockBalance.product) : '',
			quantity: '',
			unit_cost: stockBalance?.average_cost ?? '',
			min_stock: stockBalance?.min_stock ?? stockBalance?.effective_min_stock ?? '',
			note: '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(isEditMode ? stockThresholdSchema : stockAdjustmentSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			setIsPending(true);
			try {
				if (isEditMode) {
					await updateThreshold({ id: id!, min_stock: values.min_stock ?? '0' }).unwrap();
					if (values.quantity && Number(values.quantity) !== 0) {
						if (canAdjustDirectly) {
							await adjustStock({
								store: stockBalance?.store ?? storeId!,
								product: Number(values.product),
								quantity: values.quantity,
								movement_type: 'adjustment',
								unit_cost: values.unit_cost,
								note: values.note,
							}).unwrap();
						} else {
							await createStockAddRequest({
								store: stockBalance?.store ?? storeId!,
								product: Number(values.product),
								quantity: values.quantity,
								unit_cost: values.unit_cost,
								note: values.note,
							}).unwrap();
						}
					}
					onSuccess(canAdjustDirectly ? t.magasin.stockUpdated : t.magasin.stockRequestSent);
					router.push(STOCK_VIEW(id!, storeId));
				} else {
					if (canAdjustDirectly) {
						await adjustStock({
							store: storeId!,
							product: Number(values.product),
							quantity: values.quantity,
							movement_type: 'adjustment',
							unit_cost: values.unit_cost,
							note: values.note,
						}).unwrap();
					} else {
						await createStockAddRequest({
							store: storeId!,
							product: Number(values.product),
							quantity: values.quantity,
							unit_cost: values.unit_cost,
							note: values.note,
						}).unwrap();
					}
					onSuccess(canAdjustDirectly ? t.magasin.stockAdjusted : t.magasin.stockRequestSent);
					router.push(STOCK_LIST);
				}
			} catch (e) {
				onError(extractApiErrorMessage(e, canAdjustDirectly ? (isEditMode ? t.magasin.stockUpdateError : t.magasin.stockCreateError) : t.magasin.stockRequestCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	const fieldLabels = useMemo<Record<string, string>>(
		() => ({
			product: t.magasin.product,
			quantity: t.magasin.adjustmentQuantity,
			unit_cost: t.magasin.purchasePrice,
			min_stock: t.magasin.minimumStock,
			note: t.magasin.movementNote,
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

	const isLoading = isPending || adjustState.isLoading || thresholdState.isLoading || requestState.isLoading || areProductsLoading || (isEditMode && isStockLoading);
	const shouldShowError = (axiosError?.status ?? 0) > 400 && !isLoading;
	const productItems = useMemo(
		() =>
			(products?.results ?? []).map((product) => ({
				code: String(product.id),
				value: `${product.reference ?? product.barcode ?? product.id} - ${product.name}`,
			})),
		[products?.results],
	);
	const selectedProduct = productItems.find((product) => product.code === formik.values.product) ?? null;
	const fieldError = (field: keyof StockAdjustmentFormValues) =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? (formik.errors[field] as string)
			: '';
	const submitText = isEditMode
		? t.magasin.editStock
		: canAdjustDirectly
			? t.magasin.newStock
			: t.magasin.newStockRequest;

	return (
		<NavigationBar title={isEditMode ? t.magasin.editStock : t.magasin.newStock}>
			<Protected permission={isEditMode ? 'can_edit' : 'can_create'}>
				<Box sx={magasinPageContainerSx}>
					<Box sx={magasinPageContentSx}>
						<Stack spacing={3}>
							<Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" spacing={2}>
								<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(STOCK_LIST)}>
									{t.magasin.backToStock}
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
													<InventoryIcon color="primary" />
													<Typography variant="h6" fontWeight={700}>{t.magasin.stockMovement}</Typography>
												</Stack>
												<Divider sx={{ mb: 3 }} />
												<Stack spacing={2.5}>
													<CustomAutoCompleteSelect
														id="product"
														label={`${t.magasin.selectProduct} *`}
														items={productItems}
														theme={dropdownTheme}
														size="small"
														value={selectedProduct}
														onChange={(_, nextProduct) => void formik.setFieldValue('product', nextProduct ? nextProduct.code : '')}
														onBlur={formik.handleBlur('product')}
														noOptionsText={t.common.noOptions}
														error={Boolean(fieldError('product'))}
														helperText={fieldError('product')}
														startIcon={<InventoryIcon fontSize="small" />}
														disabled={isEditMode}
														fullWidth
													/>
													<CustomTextInput
														id="quantity"
														type="number"
														label={isEditMode ? t.magasin.adjustmentQuantity : `${t.magasin.adjustmentQuantity} *`}
														value={formik.values.quantity}
														onChange={formik.handleChange('quantity')}
														onBlur={formik.handleBlur('quantity')}
														error={Boolean(fieldError('quantity'))}
														helperText={fieldError('quantity')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<NumbersIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="unit_cost"
														type="number"
														label={t.magasin.purchasePrice}
														value={formik.values.unit_cost ?? ''}
														onChange={formik.handleChange('unit_cost')}
														onBlur={formik.handleBlur('unit_cost')}
														error={Boolean(fieldError('unit_cost'))}
														helperText={fieldError('unit_cost')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<NumbersIcon fontSize="small" />}
													/>
												</Stack>
											</CardContent>
										</Card>
										{isEditMode && (
											<Card elevation={2} sx={{ borderRadius: 2 }}>
												<CardContent sx={{ p: 3 }}>
													<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
														<WarningIcon color="primary" />
														<Typography variant="h6" fontWeight={700}>{t.magasin.stockThreshold}</Typography>
													</Stack>
													<Divider sx={{ mb: 3 }} />
													<CustomTextInput
														id="min_stock"
														type="number"
														label={`${t.magasin.minimumStock} *`}
														value={formik.values.min_stock ?? ''}
														onChange={formik.handleChange('min_stock')}
														onBlur={formik.handleBlur('min_stock')}
														error={Boolean(fieldError('min_stock'))}
														helperText={fieldError('min_stock')}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<WarningIcon fontSize="small" />}
													/>
												</CardContent>
											</Card>
										)}
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
													value={formik.values.note ?? ''}
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
												buttonText={submitText}
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

export default StockFormClient;
