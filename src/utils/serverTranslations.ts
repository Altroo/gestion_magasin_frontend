import { cookies } from 'next/headers';
import type { Language, TranslationDictionary } from '@/types/languageTypes';
import { translations } from '@/translations';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'fr';

export const getServerTranslations = async (): Promise<TranslationDictionary> => {
	const cookieStore = await cookies();
	const langCookie = cookieStore.get(STORAGE_KEY)?.value;
	const language: Language = langCookie === 'en' || langCookie === 'fr' ? langCookie : DEFAULT_LANGUAGE;
	return translations[language];
};
