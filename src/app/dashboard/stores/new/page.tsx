import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StoresFormClient from '@/components/pages/magasin/stores/stores-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newStoreTitle, description: t.metadata.newStoreDescription };
}

const StoreNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <StoresFormClient session={session} />;
};

export default StoreNewPage;
