import type { Language, TranslationDictionary } from '@/types/languageTypes';
import { fr } from './fr';
import { en } from './en';

export const translations: Record<Language, TranslationDictionary> = {
  fr,
  en,
};
