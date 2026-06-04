import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, DASHBOARD } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.homeTitle, description: t.metadata.homeDescription };
}

const HomePage = async () => {
	const session = await auth();

	if (session) {
		redirect(DASHBOARD);
	} else {
		redirect(AUTH_LOGIN);
	}
};

export default HomePage;
