import type { SaleType } from '@/types/gestionMagasinTypes';

export const RECEIPT_WIDTH = 32;
export const DEFAULT_PRINTER_BAUD_RATE = 9600;

export type SerialPortLike = {
	readable?: ReadableStream<Uint8Array> | null;
	writable?: WritableStream<Uint8Array> | null;
	open: (options: { baudRate: number }) => Promise<void>;
	close: () => Promise<void>;
};

export type WebSerialLike = {
	getPorts: () => Promise<SerialPortLike[]>;
	requestPort: () => Promise<SerialPortLike>;
};

export type ReceiptPrinterDetails = {
	storeName: string;
	storeAddress?: string;
	storePhone?: string;
	logoUrl?: string | null;
	logoAccessToken?: string;
};

const escapeHtml = (value: string | number) =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');

const receiptDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat('fr-MA', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).format(date);
};

export const buildBrowserReceiptHtml = (
	sale: SaleType,
	details: ReceiptPrinterDetails,
	logoDataUrl?: string | null,
) => {
	const itemRows = [...sale.lines, ...sale.promotion_lines]
		.map((line) => {
			const name = 'product_name' in line ? line.product_name : line.promotion_name;
			return `<div class="item">
				<div class="item-name">${escapeHtml(name)}</div>
				<div class="row"><span>${escapeHtml(quantity(line.quantity))} × ${escapeHtml(moneyValue(line.unit_price))}</span><strong>${escapeHtml(moneyValue(line.total))}</strong></div>
			</div>`;
		})
		.join('');
	const discount = Number(sale.discount_amount || 0);
	const change = Number(sale.change_amount || 0);

	return `<!doctype html>
<html lang="fr">
	<head>
		<meta charset="utf-8" />
		<title>Ticket ${escapeHtml(sale.id)}</title>
		<style>
			@page { size: auto; margin: 0; }
			* { box-sizing: border-box; }
			html, body { width: 80mm; margin: 0; padding: 0; background: #fff; color: #000; }
			body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.25; }
			.receipt { width: 68mm; margin: 0 auto; padding: 2mm 0 5mm; }
			.header { text-align: center; }
			.logo { display: block; max-width: 40mm; max-height: 18mm; object-fit: contain; margin: 0 auto 1.5mm; }
			.store-name { font-size: 15px; font-weight: 800; }
			.separator { border-top: 1px dashed #000; margin: 1.5mm 0; }
			.row { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
			.row > :last-child { text-align: right; white-space: nowrap; }
			.item { margin-bottom: 1mm; }
			.item-name { font-weight: 700; overflow-wrap: anywhere; }
			.total { font-size: 16px; font-weight: 900; margin: 1mm 0; }
			.footer { text-align: center; margin-top: 2mm; font-weight: 700; }
		</style>
	</head>
	<body>
		<main class="receipt">
			<header class="header">
				${logoDataUrl ? `<img class="logo" src="${escapeHtml(logoDataUrl)}" alt="" />` : ''}
				<div class="store-name">${escapeHtml(details.storeName)}</div>
				${details.storeAddress ? `<div>${escapeHtml(details.storeAddress)}</div>` : ''}
				${details.storePhone ? `<div>Tél : ${escapeHtml(details.storePhone)}</div>` : ''}
			</header>
			<div class="separator"></div>
			<div class="row"><strong>Ticket #${escapeHtml(sale.id)}</strong><span>${escapeHtml(receiptDate(sale.date_created))}</span></div>
			${sale.seller_email ? `<div>Vendeur : ${escapeHtml(sale.seller_email)}</div>` : ''}
			<div class="separator"></div>
			${itemRows}
			<div class="separator"></div>
			${discount > 0 ? `<div class="row"><span>Remise</span><strong>${escapeHtml(moneyValue(discount))}</strong></div>` : ''}
			<div class="row total"><span>TOTAL</span><span>${escapeHtml(moneyValue(sale.total))}</span></div>
			<div class="row"><span>Paiement</span><span>${escapeHtml(sale.payment_mode_name || '-')}</span></div>
			<div class="row"><span>Reçu</span><span>${escapeHtml(moneyValue(sale.paid_amount))}</span></div>
			${change > 0 ? `<div class="row"><span>Monnaie</span><span>${escapeHtml(moneyValue(change))}</span></div>` : ''}
			<div class="separator"></div>
			<footer class="footer">Merci de votre visite</footer>
		</main>
	</body>
</html>`;
};

const blobToDataUrl = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error ?? new Error('RECEIPT_LOGO_READ_FAILED'));
		reader.readAsDataURL(blob);
	});

const loadLogoDataUrl = async (details: ReceiptPrinterDetails) => {
	if (!details.logoUrl) return null;
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), 3000);
	try {
		const response = await fetch(details.logoUrl, {
			headers: details.logoAccessToken ? { Authorization: `Bearer ${details.logoAccessToken}` } : undefined,
			signal: controller.signal,
		});
		if (!response.ok) return null;
		return await blobToDataUrl(await response.blob());
	} catch {
		return null;
	} finally {
		window.clearTimeout(timeout);
	}
};

export const printBrowserReceipt = async (sale: SaleType, details: ReceiptPrinterDetails) => {
	const logoDataUrl = await loadLogoDataUrl(details);
	const frame = document.createElement('iframe');
	frame.setAttribute('aria-hidden', 'true');
	frame.style.position = 'fixed';
	frame.style.right = '0';
	frame.style.bottom = '0';
	frame.style.width = '1px';
	frame.style.height = '1px';
	frame.style.border = '0';
	frame.style.opacity = '0';
	document.body.appendChild(frame);

	const printWindow = frame.contentWindow;
	const printDocument = frame.contentDocument;
	if (!printWindow || !printDocument) {
		frame.remove();
		throw new Error('SYSTEM_PRINTER_UNAVAILABLE');
	}

	printDocument.open();
	printDocument.write(buildBrowserReceiptHtml(sale, details, logoDataUrl));
	printDocument.close();
	await Promise.all(
		Array.from(printDocument.images).map(
			(image) =>
				image.complete ||
				new Promise<void>((resolve) => {
					image.onload = () => resolve();
					image.onerror = () => resolve();
				}),
		),
	);
	await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
	try {
		printWindow.focus();
		printWindow.print();
	} finally {
		window.setTimeout(() => frame.remove(), 1000);
	}
};

const ESC = 0x1b;
const GS = 0x1d;

const normalizeText = (value: string) =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\x20-\x7e]/g, '?');

const moneyValue = (value: string | number) => `${Number(value || 0).toFixed(2)} DH`;

const centered = (value: string, width = RECEIPT_WIDTH) => {
	const text = normalizeText(value).slice(0, width);
	const leftPadding = Math.max(0, Math.floor((width - text.length) / 2));
	return `${' '.repeat(leftPadding)}${text}`;
};

const twoColumns = (leftValue: string, rightValue: string, width = RECEIPT_WIDTH) => {
	const left = normalizeText(leftValue);
	const right = normalizeText(rightValue);
	const availableLeft = Math.max(1, width - right.length - 1);
	const clippedLeft = left.slice(0, availableLeft);
	return `${clippedLeft}${' '.repeat(Math.max(1, width - clippedLeft.length - right.length))}${right.slice(0, width - 1)}`;
};

const quantity = (value: string) => {
	const parsed = Number(value || 0);
	return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
};

export const buildReceiptText = (sale: SaleType, details: ReceiptPrinterDetails) => {
	const date = new Date(sale.date_created);
	const dateLabel = Number.isNaN(date.getTime())
		? sale.date_created
		: new Intl.DateTimeFormat('fr-MA', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			}).format(date);
	const rows: string[] = [
		centered(details.storeName),
		...(details.storeAddress ? [centered(details.storeAddress)] : []),
		...(details.storePhone ? [centered(`Tel: ${details.storePhone}`)] : []),
		'-'.repeat(RECEIPT_WIDTH),
		twoColumns(`Ticket #${sale.id}`, dateLabel),
		...(sale.seller_email ? [normalizeText(sale.seller_email).slice(0, RECEIPT_WIDTH)] : []),
		'-'.repeat(RECEIPT_WIDTH),
	];

	sale.lines.forEach((line) => {
		rows.push(normalizeText(line.product_name).slice(0, RECEIPT_WIDTH));
		rows.push(twoColumns(`${quantity(line.quantity)} x ${moneyValue(line.unit_price)}`, moneyValue(line.total)));
	});

	sale.promotion_lines.forEach((line) => {
		rows.push(normalizeText(line.promotion_name).slice(0, RECEIPT_WIDTH));
		rows.push(twoColumns(`${quantity(line.quantity)} x ${moneyValue(line.unit_price)}`, moneyValue(line.total)));
	});

	rows.push('-'.repeat(RECEIPT_WIDTH));
	if (Number(sale.discount_amount || 0) > 0) {
		rows.push(twoColumns('Remise', moneyValue(sale.discount_amount)));
	}
	rows.push(twoColumns('TOTAL', moneyValue(sale.total)));
	rows.push(twoColumns('Paiement', sale.payment_mode_name || '-'));
	rows.push(twoColumns('Recu', moneyValue(sale.paid_amount)));
	if (Number(sale.change_amount || 0) > 0) {
		rows.push(twoColumns('Monnaie', moneyValue(sale.change_amount)));
	}
	rows.push('-'.repeat(RECEIPT_WIDTH), centered('Merci de votre visite'), '', '', '');

	return rows.join('\n');
};

export const buildEscPosReceipt = (sale: SaleType, details: ReceiptPrinterDetails) => {
	const text = new TextEncoder().encode(buildReceiptText(sale, details));
	const prefix = new Uint8Array([
		ESC,
		0x40, // Initialize printer.
		ESC,
		0x61,
		0x00, // Left alignment; receipt text handles centering.
		ESC,
		0x74,
		0x00, // Common PC437-compatible code page after ASCII normalization.
	]);
	const suffix = new Uint8Array([
		0x0a,
		0x0a,
		0x0a,
		GS,
		0x56,
		0x41,
		0x00, // Partial cut (ignored by printers without an auto-cutter).
	]);
	const bytes = new Uint8Array(prefix.length + text.length + suffix.length);
	bytes.set(prefix, 0);
	bytes.set(text, prefix.length);
	bytes.set(suffix, prefix.length + text.length);
	return bytes;
};

export const imageDataToEscPosRaster = (pixels: Uint8ClampedArray, width: number, height: number) => {
	const widthBytes = Math.ceil(width / 8);
	const raster = new Uint8Array(widthBytes * height);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const pixelIndex = (y * width + x) * 4;
			const alpha = pixels[pixelIndex + 3] / 255;
			const red = pixels[pixelIndex] * alpha + 255 * (1 - alpha);
			const green = pixels[pixelIndex + 1] * alpha + 255 * (1 - alpha);
			const blue = pixels[pixelIndex + 2] * alpha + 255 * (1 - alpha);
			const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
			if (luminance < 180) {
				const byteIndex = y * widthBytes + Math.floor(x / 8);
				raster[byteIndex] |= 0x80 >> (x % 8);
			}
		}
	}

	const command = new Uint8Array(8 + raster.length);
	command.set([GS, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff]);
	command.set(raster, 8);
	return command;
};

const loadLogoRaster = async (logoUrl: string, accessToken?: string) => {
	const response = await fetch(logoUrl, {
		headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
	});
	if (!response.ok) {
		throw new Error('RECEIPT_LOGO_LOAD_FAILED');
	}
	const bitmap = await createImageBitmap(await response.blob());
	try {
		const maxWidth = 200;
		const maxHeight = 96;
		const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) {
			throw new Error('RECEIPT_LOGO_CANVAS_UNAVAILABLE');
		}
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, width, height);
		context.drawImage(bitmap, 0, 0, width, height);
		return imageDataToEscPosRaster(context.getImageData(0, 0, width, height).data, width, height);
	} finally {
		bitmap.close();
	}
};

const concatenateBytes = (...parts: Uint8Array[]) => {
	const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
	let offset = 0;
	parts.forEach((part) => {
		bytes.set(part, offset);
		offset += part.length;
	});
	return bytes;
};

export const printEscPosReceipt = async (port: SerialPortLike, sale: SaleType, details: ReceiptPrinterDetails) => {
	if (!port.writable) {
		throw new Error('SERIAL_PORT_NOT_OPEN');
	}
	let receipt = buildEscPosReceipt(sale, details);
	if (details.logoUrl) {
		try {
			const logo = await loadLogoRaster(details.logoUrl, details.logoAccessToken);
			const center = new Uint8Array([ESC, 0x61, 0x01]);
			const left = new Uint8Array([ESC, 0x61, 0x00, 0x0a]);
			receipt = concatenateBytes(receipt.slice(0, 8), center, logo, left, receipt.slice(8));
		} catch {
			// A missing or malformed logo must never prevent the sale ticket itself.
		}
	}
	const writer = port.writable.getWriter();
	try {
		await writer.write(receipt);
	} finally {
		writer.releaseLock();
	}
};
