'use client';

import React from 'react';
import Styles from '@/styles/auth/auth.module.sass';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack } from '@mui/material';
import Image from 'next/image';
import SuccessIlluSVG from '../../../../../public/assets/images/success-illu.svg';
import PrimaryAnchorButton from '@/components/htmlElements/buttons/primaryAnchorButton/primaryAnchorButton';
import { AUTH_LOGIN } from '@/utils/routes';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';
import { Login as LoginIcon } from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';

const SetPasswordCompleteClient: React.FC = () => {
	const { t } = useLanguage();

	return (
		<>
			<Desktop>
				<div>
					<AuthLayout>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
						<h1 className={Styles.header}>{t.auth.passwordChanged}</h1>
						<p className={Styles.subHeader}>{t.auth.passwordChangedMessage}</p>
							<PrimaryAnchorButton
								startIcon={<LoginIcon />}
								buttonText={t.auth.loginButton}
								active={true}
								nextPage={AUTH_LOGIN}
							/>
						</Stack>
					</AuthLayout>
				</div>
			</Desktop>
			<TabletAndMobile>
				<div>
					<main className={Styles.main}>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
						<h1 className={Styles.header}>{t.auth.passwordChanged}</h1>
						<p className={Styles.subHeader}>{t.auth.passwordChangedMessage}</p>
						</Stack>
						<div className={Styles.primaryButtonWrapper}>
							<PrimaryAnchorButton
								startIcon={<LoginIcon />}
								buttonText={t.auth.loginButton}
								active={true}
								nextPage={AUTH_LOGIN}
							/>
						</div>
					</main>
				</div>
			</TabletAndMobile>
		</>
	);
};

export default SetPasswordCompleteClient;
