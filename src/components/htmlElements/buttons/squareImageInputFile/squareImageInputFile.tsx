'use client';

import React from 'react';
import Styles from './squareImageInputFile.module.sass';
import { Button, Stack, ThemeProvider } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getDefaultTheme } from '@/utils/themes';
import { useLanguage } from '@/utils/hooks';

const defaultTheme = getDefaultTheme();

type Props = {
	onImageUpload: () => void;
	children?: React.ReactNode;
};

const SquareImageInputFile: React.FC<Props> = ({ onImageUpload }) => {
	const { t } = useLanguage();
	return (
		<ThemeProvider theme={defaultTheme}>
			<Button className={Styles.squareImageWrapper} color="primary" onClick={onImageUpload}>
				<Stack
					direction="column"
					spacing={1}
					sx={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<AddIcon className={Styles.addIcon} sx={{ fontSize: 31.5 }} color="primary" />
					<span className={Styles.addImagesSpan}>{t.common.addImage}</span>
				</Stack>
			</Button>
		</ThemeProvider>
	);
};

export default SquareImageInputFile;
