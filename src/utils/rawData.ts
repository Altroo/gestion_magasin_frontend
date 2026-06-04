import type { AccountGenderCodeValueType } from '@/types/accountTypes';
import type { TranslationDictionary } from '@/types/languageTypes';

export const genderItemsList = (t: TranslationDictionary): Array<AccountGenderCodeValueType> => [
	{ code: 'H', value: t.rawData.genders.male },
	{ code: 'F', value: t.rawData.genders.female },
];
