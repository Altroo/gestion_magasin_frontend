'use client';

import { Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { DASHBOARD, AUTH_LOGIN } from '@/utils/routes';

const SSOCallbackContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const code = searchParams.get('code');

	useEffect(() => {
		const run = async () => {
			if (!code) {
				router.replace(`${AUTH_LOGIN}?error=SSOCodeMissing`);
				return;
			}

			const result = await signIn('sso-code', { code, redirect: false });
			if (result?.error) {
				router.replace(`${AUTH_LOGIN}?error=SSOFailed`);
				return;
			}
			router.replace(DASHBOARD);
		};

		void run();
	}, [code, router]);

	return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
};

const SSOCallbackPage = () => (
	<Suspense fallback={<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}>
		<SSOCallbackContent />
	</Suspense>
);

export default SSOCallbackPage;
