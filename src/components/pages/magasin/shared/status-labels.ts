import type { TranslationDictionary } from '@/types/languageTypes';

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

export const magasinStatusLabel = (t: TranslationDictionary, value?: string | null) => {
	if (!value) return '-';
	const labels: Record<string, string> = {
		draft: t.magasin.draft,
		validated: t.magasin.validated,
		cancelled: t.magasin.cancelled,
		received: t.magasin.received,
		paid: t.magasin.paid,
		payable: t.magasin.payable,
		active: t.magasin.activePromotion,
		expired: t.magasin.expiredPromotion,
	};
	return labels[value] ?? value;
};
