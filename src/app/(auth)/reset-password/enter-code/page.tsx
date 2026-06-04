import { cookies } from 'next/headers';
import { type Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_RESET_PASSWORD, DASHBOARD } from '@/utils/routes';
import EnterCodeClient from '@/components/pages/auth/reset-password/enterCode';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.enterCodeTitle, description: t.metadata.enterCodeDescription };
}

const EnterCodePage = async () => {
	const session = await auth();
	if (session) {
		redirect(DASHBOARD);
	}

	const cookieStore = await cookies();
	const email = cookieStore.get('@new_email')?.value ?? '';
	if (!email) {
		redirect(AUTH_RESET_PASSWORD);
	}

	return <EnterCodeClient email={email} />;
};

export default EnterCodePage;
