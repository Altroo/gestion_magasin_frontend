'use client';

import React, { ForwardedRef, forwardRef } from 'react';
import Styles from './authLayout.module.sass';
import { Box, Stack } from '@mui/material';
import Image from 'next/image';
import Logo from '../../../../public/assets/images/gestion-magasin-logo.png';
import BarcodeSVG from '../../../../public/assets/images/auth_illu/barcode.svg';
import StorefrontSVG from '../../../../public/assets/images/auth_illu/storefront.svg';
import { useLanguage } from '@/utils/hooks';

type Props = {
	children?: React.ReactNode;
};

const AuthLayout = forwardRef<HTMLAnchorElement, Props>((props: Props, ref: ForwardedRef<HTMLAnchorElement>) => {
	const { t } = useLanguage();

	return (
		<main className={Styles.main} ref={ref}>
			<Stack direction="row">
				{/* Left side */}
				<Box
					className={Styles.leftBox}
					sx={{
						backgroundColor: '#E8F5E9',
						overflow: 'hidden',
					}}
				>
					<Image src={Logo} alt={t.common.appLogo} width="0" height="0" sizes="100vw" className={Styles.logo} />
					<Box
						sx={{
							position: 'absolute',
							left: 18,
							bottom: 36,
							width: '82%',
							maxWidth: 290,
							zIndex: 1,
						}}
					>
						<Image
							src={StorefrontSVG}
							alt=""
							priority
							sizes="30vw"
							style={{ width: '100%', height: 'auto', display: 'block' }}
						/>
					</Box>
					<Box
						sx={{
							position: 'absolute',
							right: 20,
							bottom: 24,
							width: 76,
							zIndex: 2,
							filter: 'drop-shadow(0 12px 18px rgba(47, 52, 55, 0.12))',
						}}
					>
						<Image
							src={BarcodeSVG}
							alt=""
							priority
							sizes="12vw"
							style={{ width: '100%', height: 'auto', display: 'block' }}
						/>
					</Box>
				</Box>
				{/* Right side */}
				<Box className={Styles.rightBox}>
					{/* Children content */}
					{props.children}
				</Box>
			</Stack>
		</main>
	);
});
AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
