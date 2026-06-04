import { cookies } from 'next/headers';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import SetPasswordCompleteClient from '@/components/pages/auth/reset-password/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.passwordChangedTitle, description: t.metadata.passwordChangedDescription };
}

const SetPasswordCompletePage = async () => {
	const session = await auth();
	if (session) {
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const passUpdated = cookieStore.get('@pass_updated')?.value ?? '';
	if (!passUpdated) {
		redirect(AUTH_RESET_PASSWORD);
	}

	return (
		<>
			{passUpdated && <ClearCookiesClient />}
			<SetPasswordCompleteClient />
		</>
	);
};

export default SetPasswordCompletePage;
