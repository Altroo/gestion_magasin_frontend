import type { AccountGenderCodeValueType } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';

export const genderItemsList = (t: TranslationDictionary): Array<AccountGenderCodeValueType> => [
	{ code: 'H', value: t.rawData.genders.male },
	{ code: 'F', value: t.rawData.genders.female },
];

export const CHART_COLORS = {
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.15)',
	secondary: 'rgba(46, 125, 50, 0.8)',
	secondaryLight: 'rgba(46, 125, 50, 0.15)',
	warning: 'rgba(237, 108, 2, 0.8)',
	warningLight: 'rgba(237, 108, 2, 0.15)',
	error: 'rgba(211, 47, 47, 0.8)',
	errorLight: 'rgba(211, 47, 47, 0.15)',
	info: 'rgba(2, 136, 209, 0.8)',
	infoLight: 'rgba(2, 136, 209, 0.15)',
	purple: 'rgba(156, 39, 176, 0.8)',
	purpleLight: 'rgba(156, 39, 176, 0.15)',
};

export const PROJECT_COLORS = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(237, 108, 2, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(2, 136, 209, 0.8)',
	'rgba(255, 193, 7, 0.8)',
	'rgba(211, 47, 47, 0.8)',
	'rgba(0, 150, 136, 0.8)',
];

export const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;
