import type { TranslationDictionary } from '@/types/languageTypes';
import type { PaymentModeType } from '@/types/gestionMagasinTypes';

export const stockWorkflowStatusOptions = (t: TranslationDictionary) => [
	{ id: 'draft', nom: t.magasin.draft },
	{ id: 'validated', nom: t.magasin.validated },
	{ id: 'cancelled', nom: t.magasin.cancelled },
];

export const purchaseStatusOptions = (t: TranslationDictionary) => [
	{ id: 'draft', nom: t.magasin.draft },
	{ id: 'received', nom: t.magasin.received },
	{ id: 'cancelled', nom: t.magasin.cancelled },
];

export const expensePaymentStatusOptions = (t: TranslationDictionary) => [
	{ id: 'paid', nom: t.magasin.paid },
	{ id: 'payable', nom: t.magasin.payable },
];

const expensePaymentModeCodes = new Set(['cash', 'card', 'transfer', 'other']);

export const expensePaymentModeOptions = (t: TranslationDictionary, paymentModes?: PaymentModeType[]) => {
	if (paymentModes?.length) {
		return paymentModes
			.filter((mode) => expensePaymentModeCodes.has(mode.code) && !mode.is_credit)
			.map((mode) => ({ id: mode.code, nom: mode.name }));
	}
	return [
		{ id: 'cash', nom: t.magasin.paymentCash },
		{ id: 'card', nom: t.magasin.paymentCard },
		{ id: 'transfer', nom: t.magasin.paymentTransfer },
		{ id: 'other', nom: t.magasin.paymentOther },
	];
};

export const magasinStatusLabel = (t: TranslationDictionary, value?: string | null) => {
	if (!value) return '-';
	const labels: Record<string, string> = {
		draft: t.magasin.draft,
		validated: t.magasin.validated,
		cancelled: t.magasin.cancelled,
		received: t.magasin.received,
		confirmed: t.magasin.confirmed,
		void: t.magasin.voided,
		paid: t.magasin.paid,
		in_progress: t.magasin.inProgress,
		credit: t.magasin.credit,
		payable: t.magasin.payable,
		active: t.magasin.activePromotion,
		expired: t.magasin.expiredPromotion,
		present: t.magasin.present,
		off: t.magasin.off,
		absent: t.magasin.absent,
		morning: t.magasin.morningShift,
		afternoon: t.magasin.afternoonShift,
		evening: t.magasin.eveningShift,
		normal: t.magasin.normalSale,
		wholesale: t.magasin.wholesaleSale,
	};
	return labels[value] ?? value;
};

export const salePaymentStatusOptions = (t: TranslationDictionary) => [
	{ id: 'paid', nom: t.magasin.paid },
	{ id: 'in_progress', nom: t.magasin.inProgress },
	{ id: 'cancelled', nom: t.magasin.cancelled },
];

export const expensePaymentModeLabel = (t: TranslationDictionary, value?: string | null, paymentModes?: PaymentModeType[]) => {
	if (!value) return '-';
	return expensePaymentModeOptions(t, paymentModes).find((option) => option.id === value)?.nom ?? value;
};
