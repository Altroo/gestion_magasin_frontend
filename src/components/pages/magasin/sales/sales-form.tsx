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
	Description as DescriptionIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	ReceiptLong as ReceiptLongIcon,
	Save as SaveIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { getIn, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useCreateSaleMutation, useGetProductsQuery, useGetPromotionsQuery } from '@/store/services/magasin';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import type { SaleCreatePayload, SaleFormValues } from '@/types/gestionMagasinTypes';
import { extractApiErrorMessage, formatNumber, getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { saleSchema } from '@/utils/formValidationSchemas';
import { SALES_LIST, SALES_VIEW } from '@/utils/routes';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();

type Props = SessionProps & {
	storeId?: number;
};

const emptyLine = { type: 'product' as const, product: '', promotion: '', quantity: '1', unit_price: '0' };

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
	const { defaultStore } = useSelectedStore(token);
	const storeId = initialStoreId ?? defaultStore?.id;
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const { data: products } = useGetProductsQuery(
		{ store: storeId, page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token || !storeId },
	);
	const { data: promotions } = useGetPromotionsQuery(
		{ store: storeId, page: 1, pageSize: 100, status: 'active' },
		{ skip: !token || !storeId },
	);
	const [createSale] = useCreateSaleMutation();

	const productOptions = products?.results ?? [];
	const promotionOptions = promotions?.results ?? [];

	const formik = useFormik<SaleFormValues>({
		initialValues: {
			payment_status: 'paid',
			paid_amount: '0',
			discount_amount: '0',
			note: '',
			lines: [{ ...emptyLine }],
			globalError: '',
		},
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(saleSchema),
		onSubmit: async (values, { setFieldError }) => {
			setHasAttemptedSubmit(true);
			if (!storeId) {
				onError(t.errors.genericError);
				return;
			}
			setIsPending(true);
			const payload: SaleCreatePayload = {
				store: storeId,
				payment_status: values.payment_status,
				payment_mode_code: values.payment_status === 'credit' ? 'credit' : 'cash',
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
				router.push(SALES_VIEW(created.id, storeId));
			} catch (e) {
				onError(extractApiErrorMessage(e, t.magasin.saleCreateError));
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

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
			payment_status: t.magasin.paymentStatus,
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
	const fieldError = (field: 'payment_status' | 'paid_amount' | 'discount_amount' | 'note') =>
		(formik.touched[field] || hasAttemptedSubmit) && typeof formik.errors[field] === 'string'
			? formik.errors[field]
			: '';

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
													<ThemeProvider theme={dropdownTheme}>
														<TextField
															select
															size="small"
															id="payment_status"
															label={`${t.magasin.paymentStatus} *`}
															value={formik.values.payment_status}
															onChange={(event) => void formik.setFieldValue('payment_status', event.target.value)}
															onBlur={formik.handleBlur('payment_status')}
															error={Boolean(fieldError('payment_status'))}
															helperText={fieldError('payment_status')}
															InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardIcon fontSize="small" /></InputAdornment> }}
															fullWidth
														>
															<MenuItem value="paid">{t.magasin.paidAmount}</MenuItem>
															<MenuItem value="credit">{t.magasin.credit}</MenuItem>
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
														startIcon={<DescriptionIcon fontSize="small" />}
													/>
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
												<Stack spacing={2}>
													{formik.values.lines.map((line, index) => (
														<Box
															key={index}
															sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '150px minmax(0, 1.5fr) 140px 160px 48px' }, gap: 2, alignItems: 'flex-start' }}
														>
															<ThemeProvider theme={dropdownTheme}>
																<TextField
																	select
																	size="small"
																	label={`${t.magasin.lineType} *`}
																	value={line.type}
																	onChange={(event) => {
																		const type = event.target.value as 'product' | 'promotion';
																		void formik.setFieldValue(`lines.${index}.type`, type);
																		void formik.setFieldValue(`lines.${index}.product`, '');
																		void formik.setFieldValue(`lines.${index}.promotion`, '');
																		void formik.setFieldValue(`lines.${index}.unit_price`, '0');
																	}}
																	onBlur={formik.handleBlur(`lines.${index}.type`)}
																	error={Boolean(getLineFieldError(index, 'type'))}
																	helperText={getLineFieldError(index, 'type')}
																	InputProps={{ startAdornment: <InputAdornment position="start">{line.type === 'promotion' ? <LocalOfferIcon fontSize="small" /> : <InventoryIcon fontSize="small" />}</InputAdornment> }}
																	fullWidth
																>
																	<MenuItem value="product">{t.magasin.product}</MenuItem>
																	<MenuItem value="promotion">{t.magasin.promotion}</MenuItem>
																</TextField>
															</ThemeProvider>
															<ThemeProvider theme={dropdownTheme}>
																<TextField
																	select
																	size="small"
																	label={`${line.type === 'promotion' ? t.magasin.promotion : t.magasin.product} *`}
																	value={line.type === 'promotion' ? line.promotion : line.product}
																	onChange={(event) => (line.type === 'promotion' ? setLinePromotion(index, event.target.value) : setLineProduct(index, event.target.value))}
																	onBlur={formik.handleBlur(`lines.${index}.${line.type === 'promotion' ? 'promotion' : 'product'}`)}
																	InputProps={{ startAdornment: <InputAdornment position="start">{line.type === 'promotion' ? <LocalOfferIcon fontSize="small" /> : <InventoryIcon fontSize="small" />}</InputAdornment> }}
																	error={Boolean(getLineFieldError(index, line.type === 'promotion' ? 'promotion' : 'product'))}
																	helperText={getLineFieldError(index, line.type === 'promotion' ? 'promotion' : 'product')}
																	fullWidth
																>
																	<MenuItem value="">{t.common.selectValue}</MenuItem>
																	{line.type === 'promotion'
																		? promotionOptions.map((promotion) => (
																			<MenuItem key={promotion.id} value={String(promotion.id)}>{promotion.name}</MenuItem>
																		))
																		: productOptions.map((product) => (
																			<MenuItem key={product.id} value={String(product.id)}>{product.name}</MenuItem>
																		))}
																</TextField>
															</ThemeProvider>
															<CustomTextInput
																id={`lines.${index}.quantity`}
																type="number"
																label={`${t.magasin.quantity} *`}
																value={line.quantity}
																onChange={formik.handleChange(`lines.${index}.quantity`)}
																onBlur={formik.handleBlur(`lines.${index}.quantity`)}
																error={Boolean(getLineFieldError(index, 'quantity'))}
																helperText={getLineFieldError(index, 'quantity')}
																fullWidth
																size="small"
																theme={inputTheme}
																startIcon={<InventoryIcon fontSize="small" />}
															/>
															<CustomTextInput
																id={`lines.${index}.unit_price`}
																type="number"
																label={`${t.magasin.unitPrice} *`}
																value={line.unit_price}
																onChange={formik.handleChange(`lines.${index}.unit_price`)}
																onBlur={formik.handleBlur(`lines.${index}.unit_price`)}
																error={Boolean(getLineFieldError(index, 'unit_price'))}
																helperText={getLineFieldError(index, 'unit_price')}
																fullWidth
																size="small"
																theme={inputTheme}
																startIcon={<CreditCardIcon fontSize="small" />}
															/>
															<IconButton color="error" onClick={() => removeLine(index)} aria-label={t.magasin.removeSaleLine}>
																<DeleteIcon />
															</IconButton>
														</Box>
													))}
												</Stack>
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
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={t.magasin.newSale}
												active={!isPending}
												loading={isPending}
												startIcon={<SaveIcon />}
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
