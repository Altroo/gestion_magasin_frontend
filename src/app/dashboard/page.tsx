import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';
import DashboardClient from '@/components/pages/magasin/dashboard/dashboard';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.dashboardTitle, description: t.metadata.dashboardDescription };
}

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <DashboardClient session={session} />;
};

export default DashboardPage;
