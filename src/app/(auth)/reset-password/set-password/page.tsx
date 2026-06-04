import { cookies } from 'next/headers';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import SetPasswordClient from '@/components/pages/auth/reset-password/setPassword';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.setNewPasswordTitle, description: t.metadata.setNewPasswordDescription };
}

const SetPasswordPage = async () => {
	const session = await auth();
	if (session) {
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const email = cookieStore.get('@new_email')?.value ?? '';
	const code = cookieStore.get('@code')?.value ?? '';
	if (!email || !code) {
		redirect(AUTH_RESET_PASSWORD);
	}

	return <SetPasswordClient email={email} code={code} />;
};

export default SetPasswordPage;
