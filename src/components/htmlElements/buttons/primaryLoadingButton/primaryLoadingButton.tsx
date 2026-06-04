import React from 'react';
import { ThemeProvider, Button } from '@mui/material';
import Styles from './primaryLoadingButton.module.sass';
import { getDefaultTheme } from '@/utils/themes';

type Props = {
	buttonText: string;
	loading: boolean;
	onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void);
	active?: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	startIcon?: React.ReactNode;
	cssClass?: string;
	children?: React.ReactNode;
};

const PrimaryLoadingButton: React.FC<Props> = (props: Props) => {
	return (
		<ThemeProvider theme={getDefaultTheme()}>
			<Button
				onClick={props.onClick}
				loading={props.loading}
				className={`${Styles.primaryButtonDisabled} 
			${props.active ? `${Styles.primaryButtonActive}` : ''}
			${props.cssClass && `${props.cssClass}`}`}
				disabled={!props.active}
				type={props.type}
				color="primary"
				startIcon={props.startIcon}
			>
				{props.buttonText}
			</Button>
		</ThemeProvider>
	);
};

export default PrimaryLoadingButton;
