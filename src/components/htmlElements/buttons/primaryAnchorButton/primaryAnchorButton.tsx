'use client';

import React, { ForwardedRef, forwardRef } from 'react';
import Styles from './primaryAnchorButton.module.sass';
import { ThemeProvider, Button } from '@mui/material';
import Link from 'next/link';
import type { UrlObject } from 'url';
import { getDefaultTheme } from '@/utils/themes';

type Props = {
	buttonText: string;
	active: boolean;
	nextPage: string | UrlObject;
	startIcon?: React.ReactNode;
	onClick?: () => void;
	anchorcssClass?: string;
	cssClass?: string;
	scroll?: boolean;
	shallow?: boolean;
	replace?: boolean;
	type?: 'submit' | 'reset' | 'button' | undefined;
	children?: React.ReactNode;
};

const PrimaryAnchorButton = forwardRef<HTMLAnchorElement, Props>(
	(props: Props, ref: ForwardedRef<HTMLAnchorElement>) => {
		return (
			<Link
				href={props.nextPage}
				className={props.anchorcssClass}
				scroll={props.scroll}
				shallow={props.shallow}
				replace={props.replace}
				ref={ref}
			>
				<ThemeProvider theme={getDefaultTheme()}>
					<Button
						onClick={props.onClick}
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
			</Link>
		);
	},
);
PrimaryAnchorButton.displayName = 'PrimaryAnchorButton';

export default PrimaryAnchorButton;
