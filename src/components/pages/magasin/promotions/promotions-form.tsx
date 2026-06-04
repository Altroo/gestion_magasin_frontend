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
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	CalendarMonth as CalendarIcon,
	Close as CloseIcon,
	Description as DescriptionIcon,
	Edit as EditIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	Numbers as NumbersIcon,
	Save as SaveIcon,
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
			selling_price: promotion?.selling_price ?? '0',
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

	const addLine = () => {
		void formik.setFieldValue('lines', [...formik.values.lines, { ...emptyLine }]);
	};

	const removeLine = (index: number) => {
		const nextLines = formik.values.lines.filter((_, lineIndex) => lineIndex !== index);
		void formik.setFieldValue('lines', nextLines.length ? nextLines : [{ ...emptyLine }]);
	};

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
														error={formik.touched.name && Boolean(formik.errors.name)}
														helperText={formik.touched.name ? formik.errors.name : ''}
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
														error={formik.touched.selling_price && Boolean(formik.errors.selling_price)}
														helperText={formik.touched.selling_price ? formik.errors.selling_price : ''}
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
															error={formik.touched.status && Boolean(formik.errors.status)}
															helperText={formik.touched.status ? formik.errors.status : ''}
															InputProps={{ startAdornment: <InputAdornment position="start"><LocalOfferIcon fontSize="small" /></InputAdornment> }}
															fullWidth
														>
															<MenuItem value="active">{t.magasin.activePromotion}</MenuItem>
															<MenuItem value="expired">{t.magasin.expiredPromotion}</MenuItem>
														</TextField>
													</ThemeProvider>
													<CustomTextInput
														id="start_date"
														type="date"
														label={t.magasin.startDate}
														value={formik.values.start_date}
														onChange={formik.handleChange('start_date')}
														onBlur={formik.handleBlur('start_date')}
														error={formik.touched.start_date && Boolean(formik.errors.start_date)}
														helperText={formik.touched.start_date ? formik.errors.start_date : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<CalendarIcon fontSize="small" />}
													/>
													<CustomTextInput
														id="end_date"
														type="date"
														label={t.magasin.endDate}
														value={formik.values.end_date}
														onChange={formik.handleChange('end_date')}
														onBlur={formik.handleBlur('end_date')}
														error={formik.touched.end_date && Boolean(formik.errors.end_date)}
														helperText={formik.touched.end_date ? formik.errors.end_date : ''}
														fullWidth
														size="small"
														theme={inputTheme}
														startIcon={<CalendarIcon fontSize="small" />}
													/>
												</Box>
												<Box sx={{ mt: 2.5 }}>
													<CustomTextInput
														id="note"
														type="text"
														label={t.magasin.note}
														value={formik.values.note}
														onChange={formik.handleChange('note')}
														onBlur={formik.handleBlur('note')}
														error={formik.touched.note && Boolean(formik.errors.note)}
														helperText={formik.touched.note ? formik.errors.note : ''}
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
												<Stack spacing={2}>
													{formik.values.lines.map((line, index) => (
														<Box key={index} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 180px 44px' }, gap: 2, alignItems: 'flex-start' }}>
															<ThemeProvider theme={dropdownTheme}>
																<TextField
																	select
																	size="small"
																	label={`${t.magasin.product} *`}
																	value={line.product}
																	onChange={(event) => void formik.setFieldValue(`lines.${index}.product`, event.target.value)}
																	InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="small" /></InputAdornment> }}
																	fullWidth
																>
																	<MenuItem value="">{t.common.selectValue}</MenuItem>
																	{products?.results.map((product) => (
																		<MenuItem key={product.id} value={String(product.id)}>
																			{product.reference ?? product.barcode ?? product.id} - {product.name}
																		</MenuItem>
																	))}
																</TextField>
															</ThemeProvider>
															<CustomTextInput
																id={`lines.${index}.quantity`}
																type="number"
																label={`${t.magasin.quantity} *`}
																value={line.quantity}
																onChange={formik.handleChange(`lines.${index}.quantity`)}
																fullWidth
																size="small"
																theme={inputTheme}
																startIcon={<NumbersIcon fontSize="small" />}
															/>
															<IconButton color="error" onClick={() => removeLine(index)} sx={{ height: 40, width: 40 }}>
																<CloseIcon />
															</IconButton>
														</Box>
													))}
												</Stack>
											</CardContent>
										</Card>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
											<PrimaryLoadingButton
												type="submit"
												buttonText={isEditMode ? t.magasin.editPromotion : t.magasin.newPromotion}
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

export default PromotionsFormClient;
