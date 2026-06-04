import React from 'react';
import {act, renderHook} from '@testing-library/react';
import '@testing-library/jest-dom';
import {LanguageContext, LanguageContextProvider} from './languageContext';
import {useContext} from 'react';
import {translations} from '@/translations';

const useTestLanguage = () => useContext(LanguageContext);

describe('LanguageContextProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default French translations', () => {
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <LanguageContextProvider>{children}</LanguageContextProvider>
    );
    const {result} = renderHook(() => useTestLanguage(), {wrapper});
    expect(result.current.language).toBe('fr');
    expect(result.current.t).toEqual(translations.fr);
  });

  it('setLanguage updates the language and saves to localStorage', () => {
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <LanguageContextProvider>{children}</LanguageContextProvider>
    );
    const {result} = renderHook(() => useTestLanguage(), {wrapper});

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(result.current.t).toEqual(translations.en);
    expect(localStorage.getItem('app-language')).toBe('en');
  });

  it('uses initialLanguage prop when provided', () => {
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <LanguageContextProvider initialLanguage="en">{children}</LanguageContextProvider>
    );
    const {result} = renderHook(() => useTestLanguage(), {wrapper});
    expect(result.current.language).toBe('en');
    expect(result.current.t).toEqual(translations.en);
  });

  it('falls back to fr for invalid stored language', () => {
    localStorage.setItem('app-language', 'de');
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <LanguageContextProvider>{children}</LanguageContextProvider>
    );
    const {result} = renderHook(() => useTestLanguage(), {wrapper});
    expect(result.current.language).toBe('fr');
  });
});
