import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LanguageSwitcher from './languageSwitcher';
import { LanguageContext } from '@/contexts/languageContext';
import type { LanguageContextType } from '@/contexts/languageContext';
import { translations } from '@/translations';

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderWithLanguage = (lang: 'fr' | 'en', setLanguage = jest.fn()) => {
	const mockCtx: LanguageContextType = {
		language: lang,
		setLanguage,
		t: translations[lang],
	};
	return {
		setLanguage,
		...render(
			<LanguageContext.Provider value={mockCtx}>
				<LanguageSwitcher />
			</LanguageContext.Provider>,
		),
	};
};

describe('LanguageSwitcher', () => {
	it('displays EN when current language is fr', () => {
		renderWithLanguage('fr');
		expect(screen.getByText('EN')).toBeInTheDocument();
	});

	it('displays FR when current language is en', () => {
		renderWithLanguage('en');
		expect(screen.getByText('FR')).toBeInTheDocument();
	});

	it('calls setLanguage with en when clicking while in fr', () => {
		const setLanguage = jest.fn();
		renderWithLanguage('fr', setLanguage);
		fireEvent.click(screen.getByText('EN'));
		expect(setLanguage).toHaveBeenCalledWith('en');
	});

	it('calls setLanguage with fr when clicking while in en', () => {
		const setLanguage = jest.fn();
		renderWithLanguage('en', setLanguage);
		fireEvent.click(screen.getByText('FR'));
		expect(setLanguage).toHaveBeenCalledWith('fr');
	});
});
