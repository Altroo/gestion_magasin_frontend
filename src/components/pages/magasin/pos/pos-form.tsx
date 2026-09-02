'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import {
	Backspace as BackspaceIcon,
	AccountBalance as TransferIcon,
	Clear as ClearIcon,
	CreditCard as CreditCardIcon,
	Dialpad as DialpadIcon,
	MoreHoriz as OtherIcon,
	Payments as CashIcon,
	PersonOutlined as CreditIcon,
	PointOfSale as PointOfSaleIcon,
	Print as PrintIcon,
	QrCodeScanner as QrCodeScannerIcon,
	ReceiptLong as ReceiptLongIcon,
	Sync as SyncIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { MagasinSectionCard } from '@/components/pages/magasin/shared/magasin-card';
import { magasinPageContainerSx, magasinPageContentSx } from '@/components/pages/magasin/shared/page-layout';
import StoreTabs, { useSelectedStore } from '@/components/pages/magasin/shared/store-tabs';
import PosCart from '@/components/pages/magasin/pos/pos-cart';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useCustomerDisplay } from '@/hooks/useCustomerDisplay';
import { useReceiptPrinter } from '@/hooks/useReceiptPrinter';
import {
	useCreateSaleMutation,
	useGetPaymentModesQuery,
	useLazyScanProductQuery,
	useSyncOfflineSalesMutation,
} from '@/store/services/magasin';
import { fetchFileBlob } from '@/utils/apiHelpers';
import { useLanguage, usePermission, useToast } from '@/utils/hooks';
import { extractApiErrorMessage, setFormikAutoErrors } from '@/utils/helpers';
import { posScanSchema } from '@/utils/formValidationSchemas';
import { textInputTheme } from '@/utils/themes';
import type { SessionProps } from '@/types/_initTypes';
import type {
	PosScanFormValues,
	ProductType,
	PromotionType,
	SaleCreatePayload,
	SaleType,
	StoreType,
} from '@/types/gestionMagasinTypes';

export type ProductCartLine = {
	type: 'product';
	product: ProductType;
	quantity: number;
	unitPrice: number;
};

export type PromotionCartLine = {
	type: 'promotion';
	promotion: PromotionType;
	quantity: number;
	unitPrice: number;
};

export type CartLine = ProductCartLine | PromotionCartLine;
type SaleMode = 'normal' | 'wholesale';
type ReceiptStore = Pick<StoreType, 'id' | 'name' | 'address' | 'phone' | 'logo'>;
type CompletedSaleReceipt = { sale: SaleType; store: ReceiptStore };

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
const actionButtonSx = {
	borderRadius: 2,
	minHeight: 56,
	px: 2,
	textTransform: 'none',
	fontFamily: 'Poppins',
	fontSize: '0.95rem',
	fontWeight: 600,
};

const money = (value: number | string) => `${Number(value || 0).toFixed(2)} Dhs`;
const productSalePrice = (product: ProductType, saleType: SaleMode) =>
	Number((saleType === 'wholesale' ? product.wholesale_price : product.counter_price) || 0);
const productAvailableStock = (product: ProductType) => {
	const stock = Number(product.available_stock ?? 0);
	return Number.isFinite(stock) ? Math.max(0, stock) : 0;
};
const stockQuantity = (value: number) =>
	Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
const paymentModeIcon = (code: string) => {
	switch (code) {
		case 'cash':
			return <CashIcon />;
		case 'card':
			return <CreditCardIcon />;
		case 'credit':
			return <CreditIcon />;
		case 'transfer':
			return <TransferIcon />;
		default:
			return <OtherIcon />;
	}
};

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
	const permissions = usePermission();
	const { onSuccess, onError } = useToast();
	const { defaultStore, memberships, isLoading: areStoresLoading } = useSelectedStore(token);
	const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
	const storeId = selectedStoreId ?? defaultStore?.id;
	const selectedStore = memberships.find((membership) => membership.store.id === storeId)?.store ?? defaultStore;
	const [cart, setCart] = useState<CartLine[]>([]);
	const [offlineQueue, setOfflineQueue] = useState<SaleCreatePayload[]>(() => readOfflineQueue());
	const [numericKeypadOpen, setNumericKeypadOpen] = useState(false);
	const [hasAttemptedScan, setHasAttemptedScan] = useState(false);
	const [selectedPaymentModeId, setSelectedPaymentModeId] = useState('');
	const [saleType, setSaleType] = useState<SaleMode>('normal');
	const [lastWholesaleSaleId, setLastWholesaleSaleId] = useState<number | null>(null);
	const [lastCompletedSale, setLastCompletedSale] = useState<CompletedSaleReceipt | null>(null);
	const barcodeInputRef = useRef<HTMLInputElement | null>(null);
	const wedgeBufferRef = useRef('');
	const wedgeLastKeyAtRef = useRef(0);
	const saleInFlightRef = useRef(false);
	const syncInFlightRef = useRef(false);
	const pendingScanCodesRef = useRef<string[]>([]);
	const printer = useReceiptPrinter();
	const [scanProduct, scanState] = useLazyScanProductQuery();
	const [createSale, createState] = useCreateSaleMutation();
	const [syncOffline, syncState] = useSyncOfflineSalesMutation();
	const { data: paymentModes, isLoading: arePaymentModesLoading } = useGetPaymentModesQuery(
		{ page: 1, pageSize: 100, is_active: 'true' },
		{ skip: !token },
	);
	const paymentModeOptions = useMemo(() => paymentModes?.results ?? [], [paymentModes?.results]);
	const defaultPaymentMode = useMemo(
		() =>
			paymentModeOptions.find((mode) => mode.code === 'cash') ??
			paymentModeOptions.find((mode) => !mode.is_credit) ??
			paymentModeOptions[0],
		[paymentModeOptions],
	);
	const effectivePaymentModeId = selectedPaymentModeId || (defaultPaymentMode ? String(defaultPaymentMode.id) : '');
	const selectedStoreMembership = memberships.find((membership) => membership.store.id === storeId);
	const isSelectedStoreVendeur = selectedStoreMembership?.role.code === 'vendeur';
	const canPrintReceipt = permissions.can_print || isSelectedStoreVendeur;
	const canWholesaleSale = permissions.can_wholesale_sale && !isSelectedStoreVendeur;
	const effectiveSaleType = canWholesaleSale ? saleType : 'normal';
	const currentStoreOfflineQueue = useMemo(
		() => offlineQueue.filter((sale) => sale.store === storeId),
		[offlineQueue, storeId],
	);

	const total = useMemo(() => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), [cart]);
	useCustomerDisplay(total);

	const addProduct = useCallback(
		(product: ProductType) => {
			const availableStock = productAvailableStock(product);
			setCart((current) => {
				const existing = current.find((line) => line.type === 'product' && line.product.id === product.id);
				if (existing) {
					if (existing.quantity + 1 > availableStock) return current;
					return current.map((line) =>
						line.type === 'product' && line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
					);
				}
				if (availableStock < 1) return current;
				return [
					...current,
					{
						type: 'product',
						product,
						quantity: 1,
						unitPrice: productSalePrice(product, effectiveSaleType),
					},
				];
			});
		},
		[effectiveSaleType],
	);

	const handleSaleTypeChange = useCallback((nextType: SaleMode) => {
		setSaleType(nextType);
		setLastWholesaleSaleId(null);
		setCart((current) =>
			current.map((line) =>
				line.type === 'product' ? { ...line, unitPrice: productSalePrice(line.product, nextType) } : line,
			),
		);
	}, []);

	const scanByCode = useCallback(
		async (code: string, setFieldError?: (field: string, message: string | undefined) => void) => {
			const normalizedCode = code.trim();
			if (!storeId || !normalizedCode) {
				return false;
			}
			if (saleInFlightRef.current) {
				pendingScanCodesRef.current.push(normalizedCode);
				return true;
			}
			try {
				const product = await scanProduct({ store: storeId, code: normalizedCode }).unwrap();
				const availableStock = productAvailableStock(product);
				const cartQuantity =
					cart.find((line) => line.type === 'product' && line.product.id === product.id)?.quantity ?? 0;
				if (availableStock < 1 || cartQuantity + 1 > availableStock) {
					const message =
						availableStock < 1
							? t.magasin.productOutOfStock(product.name)
							: t.magasin.stockLimitReached(product.name, stockQuantity(availableStock));
					setFieldError?.('barcode', message);
					onError(message);
					return false;
				}
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
		},
		[addProduct, cart, onError, scanProduct, storeId, t.errors.genericError, t.magasin],
	);

	const scanFormik = useFormik<PosScanFormValues>({
		initialValues: { barcode: '', globalError: '' },
		validateOnMount: true,
		validateOnBlur: false,
		validationSchema: toFormikValidationSchema(posScanSchema),
		onSubmit: async (values, { resetForm, setFieldError }) => {
			setHasAttemptedScan(true);
			try {
				const code = values.barcode;
				resetForm();
				setHasAttemptedScan(false);
				const scanned = await scanByCode(code, setFieldError);
				if (!scanned) setHasAttemptedScan(true);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
			}
		},
	});
	const appendBarcodeDigit = (digit: string) => {
		setHasAttemptedScan(false);
		void scanFormik.setFieldValue('barcode', `${scanFormik.values.barcode}${digit}`, true);
	};
	const submitManualBarcode = async () => {
		setHasAttemptedScan(true);
		if (!scanFormik.isValid) return;
		const scanned = await scanByCode(scanFormik.values.barcode, scanFormik.setFieldError);
		if (scanned) {
			scanFormik.resetForm();
			setHasAttemptedScan(false);
			setNumericKeypadOpen(false);
		}
	};

	const lineKey = useCallback(
		(line: CartLine) => `${line.type}-${line.type === 'product' ? line.product.id : line.promotion.id}`,
		[],
	);

	const updateQuantity = useCallback(
		(targetKey: string, delta: number) => {
			const target = cart.find((line) => lineKey(line) === targetKey);
			if (target?.type === 'product' && delta > 0) {
				const availableStock = productAvailableStock(target.product);
				if (target.quantity + delta > availableStock) {
					onError(t.magasin.stockLimitReached(target.product.name, stockQuantity(availableStock)));
					return;
				}
			}
			setCart((current) =>
				current
					.map((line) => {
						if (lineKey(line) !== targetKey) return line;
						const nextQuantity = Math.max(0, line.quantity + delta);
						if (line.type === 'product' && nextQuantity > productAvailableStock(line.product)) return line;
						return { ...line, quantity: nextQuantity };
					})
					.filter((line) => line.quantity > 0),
			);
		},
		[cart, lineKey, onError, t.magasin],
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
			sale_type: effectiveSaleType,
			idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
		};
	};

	const queueOfflineSale = (salePayload: SaleCreatePayload) => {
		setOfflineQueue((current) => {
			const nextQueue = [...current, salePayload];
			writeOfflineQueue(nextQueue);
			return nextQueue;
		});
		onError(t.magasin.queuedOffline);
	};

	const focusBarcode = useCallback(() => {
		window.requestAnimationFrame(() => barcodeInputRef.current?.focus({ preventScroll: true }));
	}, []);

	const printTicket = useCallback(
		async (sale: SaleType, receiptStore: ReceiptStore, quiet = false) => {
			try {
				await printer.printReceipt(sale, {
					storeName: receiptStore.name,
					storeAddress: receiptStore.address,
					storePhone: receiptStore.phone,
					logoUrl: receiptStore.logo ? `${process.env.NEXT_PUBLIC_STORES_ROOT}${receiptStore.id}/logo/` : null,
					logoAccessToken: token,
				});
				if (!quiet) onSuccess(t.magasin.ticketPrinted);
				focusBarcode();
				return true;
			} catch {
				onError(t.magasin.ticketPrintError);
				focusBarcode();
				return false;
			}
		},
		[focusBarcode, onError, onSuccess, printer, t.magasin.ticketPrintError, t.magasin.ticketPrinted, token],
	);

	const isConnectionFailure = (error: unknown) => {
		const status = (error as { status?: string | number })?.status;
		return (
			status === 0 ||
			status === 'FETCH_ERROR' ||
			status === 'TIMEOUT_ERROR' ||
			(typeof navigator !== 'undefined' && !navigator.onLine)
		);
	};

	const confirmSale = async () => {
		if (saleInFlightRef.current || syncInFlightRef.current) {
			return;
		}
		const salePayload = payload();
		if (!salePayload || !selectedStore) {
			return;
		}
		const receiptStore: ReceiptStore = selectedStore;
		saleInFlightRef.current = true;
		try {
			const sale = await createSale(salePayload).unwrap();
			setLastWholesaleSaleId(sale.sale_type === 'wholesale' ? sale.id : null);
			setLastCompletedSale({ sale, store: receiptStore });
			setCart([]);
			onSuccess(t.magasin.saleConfirmed);
			if (canPrintReceipt && printer.autoPrint) {
				await printTicket(sale, receiptStore, true);
			}
		} catch (error) {
			setLastWholesaleSaleId(null);
			if (isConnectionFailure(error)) {
				queueOfflineSale(salePayload);
				setCart([]);
			} else {
				onError(extractApiErrorMessage(error, t.errors.genericError));
			}
		} finally {
			saleInFlightRef.current = false;
			const pendingCodes = pendingScanCodesRef.current.splice(0);
			for (const code of pendingCodes) {
				await scanByCode(code);
			}
			focusBarcode();
		}
	};

	const handlePrintFacture = async () => {
		if (!token || !lastWholesaleSaleId) {
			return;
		}
		try {
			const blob = await fetchFileBlob(`${process.env.NEXT_PUBLIC_SALES_ROOT}${lastWholesaleSaleId}/facture/`, token);
			const pdfBlob = new Blob([blob], { type: 'application/pdf' });
			const blobUrl = window.URL.createObjectURL(pdfBlob);
			window.open(blobUrl, '_blank');
		} catch {
			onError(t.magasin.saleFacturePrintError);
		} finally {
			focusBarcode();
		}
	};

	const syncQueue = async () => {
		if (!storeId || currentStoreOfflineQueue.length === 0 || saleInFlightRef.current || syncInFlightRef.current) {
			return;
		}
		syncInFlightRef.current = true;
		try {
			const response = await syncOffline({ store: storeId, sales: currentStoreOfflineQueue }).unwrap();
			const failedIndexes = new Set(
				(response.errors ?? [])
					.map((error) => Number((error as { index?: number }).index))
					.filter((index) => Number.isInteger(index)),
			);
			const failedForStore = currentStoreOfflineQueue.filter((_, index) => failedIndexes.has(index));
			const otherStores = offlineQueue.filter((sale) => sale.store !== storeId);
			const remaining = [...otherStores, ...failedForStore];
			writeOfflineQueue(remaining);
			setOfflineQueue(remaining);
			onSuccess(t.magasin.syncOffline);
		} catch {
			onError(t.errors.genericError);
		} finally {
			syncInFlightRef.current = false;
			focusBarcode();
		}
	};

	const shouldShowBarcodeError =
		Boolean(scanFormik.errors.barcode) && (hasAttemptedScan || Boolean(scanFormik.values.barcode));

	useEffect(() => {
		const handleScannerKey = (event: KeyboardEvent) => {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			const target = event.target as HTMLElement | null;
			if (target === barcodeInputRef.current) return;
			if (target?.matches('input, textarea, [contenteditable="true"]')) return;
			const now = performance.now();

			if (event.key === 'Enter' || event.key === 'Tab') {
				const code = wedgeBufferRef.current;
				wedgeBufferRef.current = '';
				if (code.length >= 3 && now - wedgeLastKeyAtRef.current < 180) {
					event.preventDefault();
					void scanByCode(code).finally(focusBarcode);
				}
				return;
			}

			if (event.key.length !== 1) return;
			if (now - wedgeLastKeyAtRef.current > 180) {
				wedgeBufferRef.current = '';
			}
			wedgeBufferRef.current += event.key;
			wedgeLastKeyAtRef.current = now;
			event.preventDefault();
		};

		window.addEventListener('keydown', handleScannerKey, true);
		return () => window.removeEventListener('keydown', handleScannerKey, true);
	}, [focusBarcode, scanByCode]);

	if (areStoresLoading) {
		return (
			<NavigationBar title={t.magasin.pos} compact>
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress />
				</Box>
			</NavigationBar>
		);
	}

	return (
		<NavigationBar title={t.magasin.pos} compact>
			<Protected permission="can_create" allow={isSelectedStoreVendeur}>
				<Box sx={{ ...magasinPageContainerSx, height: { sm: 'calc(100dvh - 64px)' }, overflow: { sm: 'hidden' } }}>
					<StoreTabs
						selectedStoreId={storeId}
						onChange={(nextStoreId) => {
							if (!saleInFlightRef.current) {
								setSelectedStoreId(nextStoreId);
								setCart([]);
								setLastWholesaleSaleId(null);
							}
						}}
						token={token}
						compact
					/>
					<Box
						sx={{
							...magasinPageContentSx,
							px: { xs: 1, sm: 1.25 },
							pt: 0,
							height: { sm: 'calc(100% - 53px)' },
							overflow: { xs: 'visible', sm: 'hidden' },
						}}
					>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(280px, 32%)' },
								gap: 1.25,
								height: { sm: '100%' },
								minHeight: 0,
							}}
						>
							<MagasinSectionCard
								sx={{ height: { sm: '100%' }, minHeight: 0 }}
								contentSx={{ p: 1.25, '&:last-child': { pb: 1.25 }, height: '100%', boxSizing: 'border-box' }}
							>
								<Stack spacing={1} sx={{ height: '100%', minHeight: 0 }}>
									<Box component="form" onSubmit={scanFormik.handleSubmit}>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: 'minmax(0, 1fr) auto',
												gap: 0.75,
												alignItems: 'start',
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
													if (event.key === 'Enter' || event.key === 'Tab') {
														event.preventDefault();
														void scanFormik.submitForm();
													}
												}}
												error={shouldShowBarcodeError}
												helperText={shouldShowBarcodeError ? scanFormik.errors.barcode : ''}
												startIcon={<QrCodeScannerIcon fontSize="small" />}
												inputRef={barcodeInputRef}
												fullWidth
												size="medium"
												sx={{
													'& .MuiOutlinedInput-root': { height: 76 },
													'& .MuiInputBase-input': { fontSize: '1.25rem', fontWeight: 700 },
												}}
												autoComplete="off"
												slotProps={{
													htmlInput: { inputMode: 'none', enterKeyHint: 'done' },
													input: {
														sx: {
															height: 76,
															'& .MuiInputBase-input': { py: 1, fontSize: '1.25rem', fontWeight: 700 },
														},
													},
												}}
												autoFocus
											/>
											<Button
												type="button"
												variant="contained"
												startIcon={<DialpadIcon />}
												onClick={() => setNumericKeypadOpen(true)}
												disabled={!storeId || scanState.isFetching}
												aria-label={t.magasin.numericKeypad}
												sx={{ ...actionButtonSx, width: 120, minWidth: 120, height: 76, px: 1.5 }}
											>
												{t.magasin.manualBarcode}
											</Button>
										</Box>
									</Box>

									<Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
										<Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
											<PointOfSaleIcon color="primary" fontSize="small" />
											<Typography sx={{ fontWeight: 800 }}>{t.magasin.cart}</Typography>
											<Chip label={cart.length} size="small" />
										</Stack>
										{currentStoreOfflineQueue.length > 0 && (
											<Button
												type="button"
												startIcon={<SyncIcon />}
												onClick={() => void syncQueue()}
												disabled={syncState.isLoading || createState.isLoading}
												sx={{ ...actionButtonSx, minHeight: 44 }}
											>
												{currentStoreOfflineQueue.length}
											</Button>
										)}
									</Stack>
									<Divider />
									<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25 }}>
										<PosCart
											cart={cart}
											lineKey={lineKey}
											onUpdateQuantity={(key, delta) => {
												updateQuantity(key, delta);
												focusBarcode();
											}}
											onRemove={(key) => {
												setCart((current) => current.filter((line) => lineKey(line) !== key));
												focusBarcode();
											}}
										/>
									</Box>
								</Stack>
							</MagasinSectionCard>

							<MagasinSectionCard
								sx={{ height: { sm: '100%' }, minHeight: 0 }}
								contentSx={{
									p: 1.25,
									'&:last-child': { pb: 1.25 },
									height: '100%',
									boxSizing: 'border-box',
									overflow: 'hidden',
								}}
							>
								<Stack spacing={1} sx={{ height: '100%', minHeight: 0 }}>
									<Stack spacing={1.1} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25 }}>
									<Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
										<Typography variant="caption" sx={{ opacity: 0.82, textTransform: 'uppercase', fontWeight: 700 }}>
											{t.magasin.total}
										</Typography>
										<Typography sx={{ fontSize: { xs: '1.8rem', sm: '2rem' }, lineHeight: 1.1, fontWeight: 900 }}>
											{money(total)}
										</Typography>
									</Box>

									{canWholesaleSale && (
										<Stack spacing={0.5}>
											<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
												{t.magasin.saleType}
											</Typography>
											<ToggleButtonGroup
												exclusive
												value={saleType}
												onChange={(_, value: SaleMode | null) => value && handleSaleTypeChange(value)}
												fullWidth
												sx={{
													height: 56,
													'& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 700, px: 0.5 },
												}}
											>
												<ToggleButton value="normal">{t.magasin.normalSale}</ToggleButton>
												<ToggleButton value="wholesale">{t.magasin.wholesaleSale}</ToggleButton>
											</ToggleButtonGroup>
										</Stack>
									)}

									<Stack spacing={0.5} sx={{ minHeight: 0 }}>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
											{t.magasin.paymentMode}
										</Typography>
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
											{paymentModeOptions.map((mode) => (
												<Button
													key={mode.id}
													type="button"
													variant={effectivePaymentModeId === String(mode.id) ? 'contained' : 'outlined'}
													startIcon={paymentModeIcon(mode.code)}
													onClick={() => {
														setSelectedPaymentModeId(String(mode.id));
														focusBarcode();
													}}
													disabled={arePaymentModesLoading || createState.isLoading}
													sx={{
														...actionButtonSx,
														minHeight: 64,
														px: 1.5,
														fontSize: '0.95rem',
														justifyContent: 'flex-start',
														textAlign: 'left',
														color: effectivePaymentModeId === String(mode.id) ? undefined : 'text.primary',
														'& .MuiButton-startIcon': {
															m: 0,
															mr: 1.25,
															width: 26,
															justifyContent: 'center',
															color: effectivePaymentModeId === String(mode.id) ? 'inherit' : 'primary.main',
														},
													}}
												>
													{mode.name}
												</Button>
											))}
										</Box>
									</Stack>

									</Stack>

									<Stack spacing={1} sx={{ flexShrink: 0, pt: 1, bgcolor: 'background.paper' }}>
										{canPrintReceipt && lastCompletedSale && (
											<Button
												type="button"
												variant="outlined"
												startIcon={<ReceiptLongIcon />}
												disabled={!printer.isReady}
												onClick={() => void printTicket(lastCompletedSale.sale, lastCompletedSale.store)}
												sx={actionButtonSx}
											>
												{t.magasin.reprintLastTicket}
											</Button>
										)}
										{canPrintReceipt && lastWholesaleSaleId && (
											<Button
												type="button"
												variant="text"
												startIcon={<PrintIcon />}
												onClick={() => void handlePrintFacture()}
												sx={actionButtonSx}
											>
												{t.magasin.printFacture}
											</Button>
										)}
										<Button
											type="button"
											variant="contained"
											startIcon={canPrintReceipt && printer.autoPrint ? <PrintIcon /> : <PointOfSaleIcon />}
											disabled={!cart.length || !effectivePaymentModeId || createState.isLoading || syncState.isLoading}
											onClick={() => void confirmSale()}
											sx={{
												...actionButtonSx,
												minHeight: 72,
												fontSize: '1.1rem',
											}}
										>
											{canPrintReceipt && printer.autoPrint ? t.magasin.confirmAndPrint : t.magasin.confirmSale}
										</Button>
									</Stack>
								</Stack>
							</MagasinSectionCard>
						</Box>
					</Box>
				</Box>

				<Dialog
					open={numericKeypadOpen}
					onClose={() => {
						setNumericKeypadOpen(false);
						focusBarcode();
					}}
					fullWidth
					maxWidth="xs"
				>
					<DialogTitle>{t.magasin.barcode}</DialogTitle>
					<DialogContent>
						<Box
							sx={{
								mb: 1.5,
								p: 1.5,
								minHeight: 64,
								border: '2px solid',
								borderColor: 'divider',
								borderRadius: 2,
								fontSize: '1.4rem',
								fontWeight: 800,
								letterSpacing: '0.08em',
								textAlign: 'center',
							}}
						>
							{scanFormik.values.barcode || '—'}
						</Box>
						{hasAttemptedScan && scanFormik.errors.barcode ? (
							<Typography color="error.main" role="alert" sx={{ mb: 1.5, textAlign: 'center', fontWeight: 700 }}>
								{scanFormik.errors.barcode}
							</Typography>
						) : null}
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
							{['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
								<Button
									key={digit}
									variant="outlined"
									onClick={() => appendBarcodeDigit(digit)}
									sx={{ ...actionButtonSx, minHeight: 68, fontSize: '1.5rem' }}
								>
									{digit}
								</Button>
							))}
							<Button
								color="error"
								variant="outlined"
								onClick={() => void scanFormik.setFieldValue('barcode', '', true)}
								sx={{ ...actionButtonSx, minHeight: 68 }}
							>
								<ClearIcon />
							</Button>
							<Button
								variant="outlined"
								onClick={() => appendBarcodeDigit('0')}
								sx={{ ...actionButtonSx, minHeight: 68, fontSize: '1.5rem' }}
							>
								0
							</Button>
							<Button
								variant="outlined"
								onClick={() => void scanFormik.setFieldValue('barcode', scanFormik.values.barcode.slice(0, -1), true)}
								sx={{ ...actionButtonSx, minHeight: 68 }}
							>
								<BackspaceIcon />
							</Button>
						</Box>
					</DialogContent>
					<DialogActions sx={{ p: 2 }}>
						<Button
							fullWidth
							variant="contained"
							disabled={!storeId || !scanFormik.isValid || scanState.isFetching}
							onClick={() => void submitManualBarcode()}
							sx={{ ...actionButtonSx, minHeight: 64, fontSize: '1.05rem' }}
						>
							{t.magasin.scan}
						</Button>
					</DialogActions>
				</Dialog>
			</Protected>
		</NavigationBar>
	);
};

export default PosClient;
