'use client';

import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import { useLanguage } from '@/utils/hooks';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import type { Language } from '@/types/languageTypes';

type LanguageFlagProps = {
	language: Language;
	size?: number;
};

export const LanguageFlag = ({ language, size = 20 }: LanguageFlagProps) => (
	<Image
		src={`/assets/flags/${language}.svg`}
		alt=""
		width={size}
		height={Math.round(size * 0.714)}
		aria-hidden="true"
	/>
);

const LanguageSwitcher: React.FC = () => {
	const { language, setLanguage } = useLanguage();

	const toggleLanguage = () => {
		setLanguage(language === 'fr' ? 'en' : 'fr');
	};

	const nextLanguage = language === 'fr' ? 'en' : 'fr';
	const label = language === 'fr' ? 'English' : 'Français';

	return (
		<>
			<Desktop>
				<Tooltip title={label}>
					<Button variant="text" color="inherit" onClick={toggleLanguage} startIcon={<LanguageFlag language={nextLanguage} />}>
						{language === 'fr' ? 'EN' : 'FR'}
					</Button>
				</Tooltip>
			</Desktop>
			<TabletAndMobile>
				<Tooltip title={label}>
					<IconButton color="inherit" onClick={toggleLanguage} aria-label={label}>
						<LanguageFlag language={nextLanguage} />
					</IconButton>
				</Tooltip>
			</TabletAndMobile>
		</>
	);
};

export default LanguageSwitcher;
