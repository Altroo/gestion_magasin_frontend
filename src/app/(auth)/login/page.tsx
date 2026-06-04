import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import LoginClient from '@/components/pages/auth/login/login';
import { DASHBOARD } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.loginTitle, description: t.metadata.loginDescription };
}

const LoginPage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	}

	return <LoginClient />;
};

export default LoginPage;
