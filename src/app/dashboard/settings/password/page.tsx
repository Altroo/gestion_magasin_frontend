import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import PasswordClient from '@/components/pages/settings/password';
import { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.changePasswordTitle, description: t.metadata.changePasswordDescription };
}

const EditPasswordPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PasswordClient />;
};

export default EditPasswordPage;
