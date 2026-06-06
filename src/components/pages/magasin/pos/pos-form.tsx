'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	Divider,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridRenderCellParams } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import {
	Add as AddIcon,
	CreditCard as CreditCardIcon,
	Delete as DeleteIcon,
	Inventory2 as InventoryIcon,
	LocalOffer as LocalOfferIcon,
	PointOfSale as PointOfSaleIcon,
	QrCodeScanner as QrCodeScannerIcon,
	ReceiptLong as ReceiptLongIcon,
	Remove as RemoveIcon,
	Sync as SyncIcon,
	Videocam as VideocamIcon,
	VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { MagasinKpiCard, MagasinSectionCard } from '@/components/pages/magasin/shared/magasin-card';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import { useInitAccessToken } from '@/contexts/InitContext';
import {
	useCreateSaleMutation,
	useGetDashboardStatsQuery,
	useGetPaymentModesQuery,
	useGetPromotionsQuery,
	useLazyScanProductQuery,
	useSyncOfflineSalesMutation,
} from '@/store/services/magasin';
import { useLanguage, useToast } from '@/utils/hooks';
import { setFormikAutoErrors } from '@/utils/helpers';
import { posScanSchema } from '@/utils/formValidationSchemas';
import { customDropdownTheme, textInputTheme } from '@/utils/themes';
import type { SessionProps } from '@/types/_initTypes';
import type { PosScanFormValues, ProductType, PromotionType, SaleCreatePayload } from '@/types/gestionMagasinTypes';

type ProductCartLine = {
	type: 'product';
	product: ProductType;
	quantity: number;
	unitPrice: number;
};

type PromotionCartLine = {
	type: 'promotion';
	promotion: PromotionType;
	quantity: number;
	unitPrice: number;
};

type CartLine = ProductCartLine | PromotionCartLine;

type CartGridRow = {
	id: string;
	name: string;
	reference: string;
	typeLabel: string;
	quantity: number;
	unitPrice: number;
	total: number;
};

type ScanErrorPayload = {
	status_code?: number;
	message?: string;
	details?: Record<string, string[] | string>;
	detail?: string;
};

type ScanError = {
	status?: number;
	data?: ScanErrorPayload;
	error?: ScanErrorPayload;
};

const OFFLINE_KEY = 'gestion-magasin-offline-sales';
const inputTheme = textInputTheme();
const dropdownTheme = customDropdownTheme();
const actionButtonSx = {
	borderRadius: '50px',
	height: '3rem',
	px: 3,
	textTransform: 'none',
	fontFamily: 'Poppins',
	fontSize: '17px',
	fontWeight: 600,
};

const money = (value: number | string) => `${Number(value || 0).toFixed(2)} Dhs`;

const readOfflineQueue = (): SaleCreatePayload[] => {
	if (typeof window === 'undefined') {
		return [];
	}
	try {
		return JSON.parse(window.localStorage.getItem(OFFLINE_KEY) || '[]') as SaleCreatePayload[];
	} catch {
		return [];
	}
};

const writeOfflineQueue = (sales: SaleCreatePayload[]) => {
	window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(sales));
};

const getScanErrorPayload = (error: unknown) => {
	const scanError = error as ScanError;
	const payload = scanError.data ?? scanError.error ?? (error as ScanErrorPayload);
	const statusCode = payload?.status_code ?? scanError.status;
	const detailValue = payload?.details?.barcode ?? payload?.details?.detail ?? payload?.detail ?? payload?.message;
	const message = Array.isArray(detailValue) ? detailValue[0] : detailValue;

	return { statusCode, message };
};

const PosClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
	const storeId = selectedStoreId ?? defaultStore?.id;
	const [cart, setCart] = useState<CartLine[]>([]);
	const [cartPaginationModel, setCartPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
	const [offlineQueue, setOfflineQueue] = useState<SaleCreatePayload[]>(() => readOfflineQueue());
	const [cameraActive, setCameraActive] = useState(false);
	const [hasAttemptedScan, setHasAttemptedScan] = useState(false);
	const [selectedPaymentModeId, setSelectedPaymentModeId] = useState('');
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const scanTimerRef = useRef<number | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [scanProduct, scanState] = useLazyScanProductQuery();
	const [createSale, createState] = useCreateSaleMutation();
	const [syncOffline, syncState] = useSyncOfflineSalesMutation();
	const { data: stats } = useGetDashboardStatsQuery({ store: storeId }, { skip: !token || !storeId });
	const { data: promotions } = useGetPromotionsQuery(
		{ store: storeId, page: 1, pageSize: 50, status: 'active' },
		{ skip: !token || !storeId },
	);
	const { data: paymentModes, isLoading: arePaymentModesLoading } = useGetPaymentModesQuery(
		{ page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token },
	);
	const paymentModeOptions = useMemo(() => paymentModes?.results ?? [], [paymentModes?.results]);
	const defaultPaymentMode = useMemo(
		() => paymentModeOptions.find((mode) => mode.code === 'cash') ?? paymentModeOptions.find((mode) => !mode.is_credit) ?? paymentModeOptions[0],
		[paymentModeOptions],
	);
	const effectivePaymentModeId = selectedPaymentModeId || (defaultPaymentMode ? String(defaultPaymentMode.id) : '');

	const total = useMemo(
		() => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
		[cart],
	);

	const addProduct = (product: ProductType) => {
		setCart((current) => {
			const existing = current.find((line) => line.type === 'product' && line.product.id === product.id);
			if (existing) {
				return current.map((line) =>
					line.type === 'product' && line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
				);
			}
			return [
				...current,
				{
					type: 'product',
					product,
					quantity: 1,
					unitPrice: Number(product.counter_price || 0),
				},
			];
		});
	};

	const addPromotion = (promotion: PromotionType) => {
		setCart((current) => {
			const existing = current.find((line) => line.type === 'promotion' && line.promotion.id === promotion.id);
			if (existing) {
				return current.map((line) =>
					line.type === 'promotion' && line.promotion.id === promotion.id ? { ...line, quantity: line.quantity + 1 } : line,
				);
			}
			return [
				...current,
				{
					type: 'promotion',
					promotion,
					quantity: 1,
					unitPrice: Number(promotion.selling_price || 0),
				},
			];
		});
	};

	const scanByCode = async (code: string, setFieldError?: (field: string, message: string | undefined) => void) => {
		if (!storeId || !code) {
			return false;
		}
		try {
			const product = await scanProduct({ store: storeId, code: code.trim() }).unwrap();
			addProduct(product);
			return true;
		} catch (e) {
			const { statusCode, message } = getScanErrorPayload(e);
			if (setFieldError && (statusCode === 400 || statusCode === 404) && message) {
				setFieldError('barcode', message);
				return false;
			}
			if (setFieldError) {
				setFormikAutoErrors({ e, setFieldError });
			}
			onError(message || t.errors.genericError);
			return false;
		}
	};

	const scanFormik = useFormik<PosScanFormValues>({
		initialValues: { barcode: '', globalError: '' },
		validateOnMount: true,
		validateOnBlur: false,
		validationSchema: toFormikValidationSchema(posScanSchema),
		onSubmit: async (values, { resetForm, setFieldError }) => {
			setHasAttemptedScan(true);
			try {
				const scanned = await scanByCode(values.barcode, setFieldError);
				if (scanned) {
					resetForm();
					setHasAttemptedScan(false);
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const lineKey = useCallback(
		(line: CartLine) => `${line.type}-${line.type === 'product' ? line.product.id : line.promotion.id}`,
		[],
	);

	const updateQuantity = useCallback((targetKey: string, delta: number) => {
		setCart((current) =>
			current
				.map((line) =>
					lineKey(line) === targetKey
						? { ...line, quantity: Math.max(0, line.quantity + delta) }
						: line,
				)
				.filter((line) => line.quantity > 0),
		);
	}, [lineKey]);

	const cartRows = useMemo<CartGridRow[]>(
		() =>
			cart.map((line) => {
				const isProduct = line.type === 'product';
				const name = isProduct ? line.product.name : line.promotion.name;
				const reference = isProduct ? (line.product.reference ?? line.product.barcode ?? '') : t.magasin.promotion;
				return {
					id: lineKey(line),
					name,
					reference,
					typeLabel: isProduct ? t.magasin.product : t.magasin.promotion,
					quantity: line.quantity,
					unitPrice: line.unitPrice,
					total: line.quantity * line.unitPrice,
				};
			}),
		[cart, lineKey, t.magasin.product, t.magasin.promotion],
	);

	const cartColumns = useMemo<GridColDef<CartGridRow>[]>(
		() => [
			{
				field: 'name',
				headerName: t.magasin.product,
				flex: 1.4,
				minWidth: 180,
				renderCell: (params: GridRenderCellParams<CartGridRow>) => (
					<Box sx={{ minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
						<Typography variant="body2" fontWeight={600} noWrap>
							{params.row.name}
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							{params.row.reference || params.row.typeLabel}
						</Typography>
					</Box>
				),
			},
			{
				field: 'typeLabel',
				headerName: 'Type',
				width: 105,
				renderCell: (params: GridRenderCellParams<CartGridRow>) => (
					<Chip label={params.row.typeLabel} size="small" variant="outlined" />
				),
			},
			{
				field: 'unitPrice',
				headerName: t.magasin.unitPrice,
				width: 110,
				align: 'left',
				headerAlign: 'left',
				valueFormatter: (value: number) => money(value),
			},
			{
				field: 'quantity',
				headerName: t.magasin.quantity,
				width: 170,
				align: 'center',
				headerAlign: 'center',
				sortable: false,
				filterable: false,
				renderCell: (params: GridRenderCellParams<CartGridRow>) => (
					<Stack
						direction="row"
						spacing={0.5}
						justifyContent="center"
						alignItems="center"
						sx={{ width: '100%', height: '100%' }}
					>
						<IconButton type="button" size="small" onClick={() => updateQuantity(params.row.id, -1)} aria-label="Diminuer">
							<RemoveIcon fontSize="small" />
						</IconButton>
						<Typography variant="body2" sx={{ width: 42, textAlign: 'center', fontWeight: 600 }}>
							{params.row.quantity}
						</Typography>
						<IconButton type="button" size="small" onClick={() => updateQuantity(params.row.id, 1)} aria-label="Augmenter">
							<AddIcon fontSize="small" />
						</IconButton>
					</Stack>
				),
			},
			{
				field: 'total',
				headerName: t.magasin.total,
				width: 120,
				align: 'left',
				headerAlign: 'left',
				valueFormatter: (value: number) => money(value),
			},
			{
				field: 'actions',
				headerName: t.common.actions,
				width: 95,
				sortable: false,
				filterable: false,
				disableColumnMenu: true,
				align: 'left',
				renderCell: (params: GridRenderCellParams<CartGridRow>) => (
					<IconButton type="button" color="error" size="small" onClick={() => setCart((current) => current.filter((item) => lineKey(item) !== params.row.id))}>
						<DeleteIcon fontSize="small" />
					</IconButton>
				),
			},
		],
		[lineKey, t.common.actions, t.magasin.product, t.magasin.quantity, t.magasin.total, t.magasin.unitPrice, updateQuantity],
	);

	const payload = (): SaleCreatePayload | null => {
		if (!storeId || !cart.length || !effectivePaymentModeId) {
			return null;
		}
		return {
			store: storeId,
			lines: cart
				.filter((line): line is ProductCartLine => line.type === 'product')
				.map((line) => ({
					product: line.product.id,
					quantity: String(line.quantity),
					unit_price: String(line.unitPrice),
				})),
			promotion_lines: cart
				.filter((line): line is PromotionCartLine => line.type === 'promotion')
				.map((line) => ({
					promotion: line.promotion.id,
					quantity: String(line.quantity),
					unit_price: String(line.unitPrice),
				})),
			payment_mode: Number(effectivePaymentModeId),
			paid_amount: String(total),
			idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
		};
	};

	const queueOfflineSale = (salePayload: SaleCreatePayload) => {
		const nextQueue = [...offlineQueue, salePayload];
		writeOfflineQueue(nextQueue);
		setOfflineQueue(nextQueue);
		onError(t.magasin.queuedOffline);
	};

	const confirmSale = async () => {
		const salePayload = payload();
		if (!salePayload) {
			return;
		}
		try {
			await createSale(salePayload).unwrap();
			setCart([]);
			onSuccess(t.magasin.saleConfirmed);
		} catch {
			queueOfflineSale(salePayload);
			setCart([]);
		}
	};

	const syncQueue = async () => {
		if (!storeId || offlineQueue.length === 0) {
			return;
		}
		try {
			const response = await syncOffline({ store: storeId, sales: offlineQueue }).unwrap();
			const failed = response.errors?.length ? offlineQueue.slice(-response.errors.length) : [];
			writeOfflineQueue(failed);
			setOfflineQueue(failed);
			onSuccess(t.magasin.syncOffline);
		} catch {
			onError(t.errors.genericError);
		}
	};

	const shouldShowBarcodeError = Boolean(scanFormik.errors.barcode) && (hasAttemptedScan || Boolean(scanFormik.values.barcode));

	const stopCamera = () => {
		if (scanTimerRef.current) {
			window.clearInterval(scanTimerRef.current);
			scanTimerRef.current = null;
		}
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		setCameraActive(false);
	};

	const startCamera = async () => {
		if (!('mediaDevices' in navigator) || !(window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector) {
			onError(t.errors.genericError);
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
			setCameraActive(true);
			const Detector = (window as unknown as { BarcodeDetector: new (args: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
			const detector = new Detector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
			scanTimerRef.current = window.setInterval(async () => {
				if (!videoRef.current) {
					return;
				}
				const codes = await detector.detect(videoRef.current);
				const code = codes[0]?.rawValue;
				if (code) {
					await scanByCode(code);
					stopCamera();
				}
			}, 700);
		} catch {
			onError(t.errors.genericError);
		}
	};

	useEffect(() => stopCamera, []);

	return (
		<NavigationBar title={t.magasin.pos}>
			<Protected permission="can_create">
				<Box sx={magasinPageContainerSx}>
					<StoreTabs selectedStoreId={storeId} onChange={setSelectedStoreId} token={token} />
					<Box sx={magasinPageContentSx}>
						<Stack spacing={2}>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
								<Box>
									<MagasinKpiCard
										icon={<PointOfSaleIcon fontSize="small" />}
										label={t.magasin.todaySales}
										value={money(stats?.total_sales ?? 0)}
										color="#2e7d32"
									/>
								</Box>
								<Box>
									<MagasinKpiCard
										icon={<ReceiptLongIcon fontSize="small" />}
										label={t.magasin.sales}
										value={stats?.sales_count ?? 0}
										color="#1976d2"
									/>
								</Box>
								<Box>
									<MagasinKpiCard
										icon={<InventoryIcon fontSize="small" />}
										label={t.magasin.lowStock}
										value={stats?.low_stock_count ?? 0}
										color="#ed6c02"
									/>
								</Box>
							</Box>
							<Box component="form" onSubmit={scanFormik.handleSubmit}>
								<MagasinSectionCard contentSx={{ p: 2, '&:last-child': { pb: 2 } }}>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 1fr) 150px 150px' },
											gap: 1.5,
											alignItems: 'flex-start',
											justifyContent: 'flex-start',
										}}
									>
										<CustomTextInput
											id="barcode"
											name="barcode"
											type="text"
											theme={inputTheme}
											label={t.magasin.barcode}
											value={scanFormik.values.barcode}
											onChange={(event) => {
												setHasAttemptedScan(false);
												scanFormik.handleChange(event);
											}}
											onBlur={scanFormik.handleBlur}
											onKeyDown={(event) => {
												if (event.key === 'Enter') {
													event.preventDefault();
													void scanFormik.submitForm();
												}
											}}
											error={shouldShowBarcodeError}
											helperText={shouldShowBarcodeError ? scanFormik.errors.barcode : ''}
											startIcon={<QrCodeScannerIcon fontSize="small" />}
											fullWidth
											size="small"
											slotProps={{
												input: {
													sx: {
														height: 48,
														'& .MuiInputBase-input': { py: 1 },
													},
												},
											}}
											autoFocus
										/>
										<Button
											type="submit"
											variant="contained"
											startIcon={<QrCodeScannerIcon />}
											disabled={!storeId || !scanFormik.isValid || scanState.isFetching}
											sx={{ ...actionButtonSx, minWidth: { xs: '100%', md: 150 } }}
										>
											{t.magasin.scan}
										</Button>
										<Button
											type="button"
											variant="outlined"
											startIcon={cameraActive ? <VideocamOffIcon /> : <VideocamIcon />}
											onClick={cameraActive ? stopCamera : () => void startCamera()}
											sx={{ ...actionButtonSx, minWidth: { xs: '100%', md: 150 } }}
										>
											{cameraActive ? t.magasin.stopCamera : t.magasin.camera}
										</Button>
									</Box>
									{cameraActive && (
										<Box sx={{ mt: 2, overflow: 'hidden', borderRadius: 1, bgcolor: 'black' }}>
											<video ref={videoRef} muted playsInline style={{ display: 'block', width: '100%', maxHeight: 320, objectFit: 'cover' }} />
										</Box>
									)}
									{scanFormik.errors.globalError && (
										<Alert severity="error" sx={{ mt: 2 }}>
											{scanFormik.errors.globalError}
										</Alert>
									)}
								</MagasinSectionCard>
							</Box>
							{(promotions?.results?.length ?? 0) > 0 && (
								<MagasinSectionCard
									title={t.magasin.promotions}
									icon={<LocalOfferIcon fontSize="small" />}
									contentSx={{ p: 2, '&:last-child': { pb: 2 } }}
								>
									<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
										{promotions?.results.map((promotion) => (
											<Button
												type="button"
												key={promotion.id}
												variant="outlined"
												startIcon={<LocalOfferIcon />}
												onClick={() => addPromotion(promotion)}
												sx={{ borderRadius: '50px', textTransform: 'none' }}
											>
												{promotion.name} - {money(promotion.selling_price)}
											</Button>
										))}
									</Stack>
								</MagasinSectionCard>
							)}
							<MagasinSectionCard
								title={t.magasin.cart}
								icon={<PointOfSaleIcon fontSize="small" />}
								action={
									offlineQueue.length > 0 ? (
										<Stack direction="row" spacing={1}>
											<Chip label={`${t.magasin.offlineQueue}: ${offlineQueue.length}`} size="small" />
											<IconButton type="button" onClick={() => void syncQueue()} disabled={syncState.isLoading} aria-label={t.magasin.syncOffline}>
												<SyncIcon />
											</IconButton>
										</Stack>
									) : undefined
								}
								sx={{ width: '100%' }}
								contentSx={{ p: 2, '&:last-child': { pb: 2 } }}
							>
								{cart.length === 0 ? (
									<Alert severity="info">{t.magasin.emptyCart}</Alert>
								) : (
									<Box sx={{ width: '100%' }}>
										<DataGrid
											rows={cartRows}
											columns={cartColumns}
											showToolbar
											slotProps={{
												toolbar: {
													showQuickFilter: true,
													quickFilterProps: { debounceMs: 500 },
												},
											}}
											localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
											disableRowSelectionOnClick
											paginationModel={cartPaginationModel}
											onPaginationModelChange={setCartPaginationModel}
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
								)}
								<Divider sx={{ my: 2 }} />
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
									<ThemeProvider theme={dropdownTheme}>
										<TextField
											select
											size="small"
											id="payment_mode"
											label={`${t.magasin.paymentMode} *`}
											value={effectivePaymentModeId}
											onChange={(event) => setSelectedPaymentModeId(event.target.value)}
											disabled={arePaymentModesLoading || paymentModeOptions.length === 0}
											InputProps={{ startAdornment: <InputAdornment position="start"><CreditCardIcon fontSize="small" /></InputAdornment> }}
											sx={{ minWidth: { xs: '100%', sm: 260 } }}
										>
											{paymentModeOptions.map((mode) => (
												<MenuItem key={mode.id} value={String(mode.id)}>
													{mode.name}
												</MenuItem>
											))}
										</TextField>
									</ThemeProvider>
									<Stack spacing={0.25}>
										<Typography variant="caption" color="text.secondary">
											{t.magasin.total}
										</Typography>
										<Typography variant="h6" fontWeight={700}>
											{money(total)}
										</Typography>
									</Stack>
									<Button
										type="button"
										variant="contained"
										size="large"
										startIcon={<PointOfSaleIcon />}
										disabled={!cart.length || !effectivePaymentModeId || createState.isLoading}
										onClick={() => void confirmSale()}
										sx={actionButtonSx}
									>
										{t.magasin.confirmSale}
									</Button>
								</Stack>
							</MagasinSectionCard>
						</Stack>
					</Box>
				</Box>
			</Protected>
		</NavigationBar>
	);
};

export default PosClient;
