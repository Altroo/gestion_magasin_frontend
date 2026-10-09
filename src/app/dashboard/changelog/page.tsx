import { redirect } from 'next/navigation';
import { getServerTranslations } from '@/utils/serverTranslations';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import Changelog from '@/components/pages/dashboard/changelog/changelog';

export const generateMetadata = async () => {
	const t = await getServerTranslations();
	return { title: t.navigation.changelog, description: t.changelog.description };
};

const ChangelogPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <Changelog />;
};

export default ChangelogPage;
