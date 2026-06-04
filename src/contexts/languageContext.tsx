'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { Language, TranslationDictionary } from '@/types/languageTypes';
import { translations } from '@/translations';
import { setHelpersLanguage } from '@/utils/helpers';

const STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'fr';

export type LanguageContextType = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: TranslationDictionary;
};

export const LanguageContext = createContext<LanguageContextType>({
	language: DEFAULT_LANGUAGE,
	setLanguage: () => {},
	t: translations[DEFAULT_LANGUAGE],
});

export const LanguageContextProvider: React.FC<{ children: React.ReactNode; initialLanguage?: Language }> = ({ children, initialLanguage }) => {
	const [language, setLanguageState] = useState<Language>(initialLanguage ?? DEFAULT_LANGUAGE);

	useEffect(() => {
		setHelpersLanguage(initialLanguage ?? DEFAULT_LANGUAGE);
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'fr' || stored === 'en') {
			document.cookie = `${STORAGE_KEY}=${stored};path=/;max-age=31536000;SameSite=Lax`;
		}
	}, [initialLanguage]);

	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		setHelpersLanguage(lang);
		localStorage.setItem(STORAGE_KEY, lang);
		document.cookie = `${STORAGE_KEY}=${lang};path=/;max-age=31536000;SameSite=Lax`;
	}, []);

	const t = translations[language];

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};
