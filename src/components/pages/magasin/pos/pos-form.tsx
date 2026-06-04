'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	Divider,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Inventory2 as InventoryIcon,
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
	useLazyScanProductQuery,
	useSyncOfflineSalesMutation,
} from '@/store/services/magasin';
import { useLanguage, useToast } from '@/utils/hooks';
import { setFormikAutoErrors } from '@/utils/helpers';
import { posScanSchema } from '@/utils/formValidationSchemas';
import { textInputTheme } from '@/utils/themes';
import type { SessionProps } from '@/types/_initTypes';
import type { PosScanFormValues, ProductType, SaleCreatePayload } from '@/types/gestionMagasinTypes';

type CartLine = {
	product: ProductType;
	quantity: number;
	unitPrice: number;
};

const OFFLINE_KEY = 'gestion-magasin-offline-sales';
const inputTheme = textInputTheme();
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

const PosClient = ({ session }: SessionProps) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { defaultStore } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
	const storeId = selectedStoreId ?? defaultStore?.id;
	const [cart, setCart] = useState<CartLine[]>([]);
	const [offlineQueue, setOfflineQueue] = useState<SaleCreatePayload[]>(() => readOfflineQueue());
	const [cameraActive, setCameraActive] = useState(false);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const scanTimerRef = useRef<number | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [scanProduct, scanState] = useLazyScanProductQuery();
	const [createSale, createState] = useCreateSaleMutation();
	const [syncOffline, syncState] = useSyncOfflineSalesMutation();
	const { data: stats } = useGetDashboardStatsQuery({ store: storeId }, { skip: !token || !storeId });

	const total = useMemo(
		() => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
		[cart],
	);

	const addProduct = (product: ProductType) => {
		setCart((current) => {
			const existing = current.find((line) => line.product.id === product.id);
			if (existing) {
				return current.map((line) =>
					line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
				);
			}
			return [
				...current,
				{
					product,
					quantity: 1,
					unitPrice: Number(product.counter_price || 0),
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
			if (setFieldError) {
				setFormikAutoErrors({ e, setFieldError });
			}
			onError(t.errors.genericError);
			return false;
		}
	};

	const scanFormik = useFormik<PosScanFormValues>({
		initialValues: { barcode: '', globalError: '' },
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(posScanSchema),
		onSubmit: async (values, { resetForm, setFieldError }) => {
			try {
				const scanned = await scanByCode(values.barcode, setFieldError);
				if (scanned) {
					resetForm();
				}
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});

	const updateQuantity = (productId: number, delta: number) => {
		setCart((current) =>
			current
				.map((line) =>
					line.product.id === productId
						? { ...line, quantity: Math.max(0, line.quantity + delta) }
						: line,
				)
				.filter((line) => line.quantity > 0),
		);
	};

	const payload = (): SaleCreatePayload | null => {
		if (!storeId || !cart.length) {
			return null;
		}
		return {
			store: storeId,
			lines: cart.map((line) => ({
				product: line.product.id,
				quantity: String(line.quantity),
				unit_price: String(line.unitPrice),
			})),
			payment_mode_code: 'cash',
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
											onChange={scanFormik.handleChange}
											onBlur={scanFormik.handleBlur}
											onKeyDown={(event) => {
												if (event.key === 'Enter') {
													event.preventDefault();
													void scanFormik.submitForm();
												}
											}}
											error={scanFormik.touched.barcode && Boolean(scanFormik.errors.barcode)}
											helperText={scanFormik.touched.barcode ? scanFormik.errors.barcode : ''}
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
							<MagasinSectionCard
								title={t.magasin.cart}
								icon={<PointOfSaleIcon fontSize="small" />}
								action={
									<Stack direction="row" spacing={1}>
										<Chip label={`${t.magasin.offlineQueue}: ${offlineQueue.length}`} size="small" />
										<IconButton onClick={() => void syncQueue()} disabled={!offlineQueue.length || syncState.isLoading} aria-label={t.magasin.syncOffline}>
											<SyncIcon />
										</IconButton>
									</Stack>
								}
								sx={{ width: '100%' }}
								contentSx={{ p: 2, '&:last-child': { pb: 2 } }}
							>
								{cart.length === 0 ? (
									<Alert severity="info">{t.magasin.emptyCart}</Alert>
								) : (
									<TableContainer>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>{t.magasin.product}</TableCell>
													<TableCell align="right">{t.magasin.quantity}</TableCell>
													<TableCell align="right">{t.magasin.total}</TableCell>
													<TableCell />
												</TableRow>
											</TableHead>
											<TableBody>
												{cart.map((line) => (
													<TableRow key={line.product.id}>
														<TableCell>
															<Typography variant="body2" fontWeight={600}>{line.product.name}</Typography>
															<Typography variant="caption" color="text.secondary">{line.product.reference ?? line.product.barcode}</Typography>
														</TableCell>
														<TableCell align="right">
															<Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
																<IconButton size="small" onClick={() => updateQuantity(line.product.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
																<Typography sx={{ minWidth: 28, textAlign: 'center' }}>{line.quantity}</Typography>
																<IconButton size="small" onClick={() => updateQuantity(line.product.id, 1)}><AddIcon fontSize="small" /></IconButton>
															</Stack>
														</TableCell>
														<TableCell align="right">{money(line.quantity * line.unitPrice)}</TableCell>
														<TableCell align="right">
															<IconButton color="error" size="small" onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))}>
																<DeleteIcon fontSize="small" />
															</IconButton>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								)}
								<Divider sx={{ my: 2 }} />
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="h6">{money(total)}</Typography>
									<Button
										variant="contained"
										size="large"
										startIcon={<PointOfSaleIcon />}
										disabled={!cart.length || createState.isLoading}
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
