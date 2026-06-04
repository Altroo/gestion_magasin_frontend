import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';
import NotificationsClient from '@/components/pages/magasin/notifications/notifications-list';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.notificationsTitle, description: t.metadata.notificationsDescription };
}

const NotificationsSettingsPage = async () => {
	const session = await auth();
	if (!session) {
		redirect(AUTH_LOGIN);
	}
	return <NotificationsClient session={session} />;
};

export default NotificationsSettingsPage;
