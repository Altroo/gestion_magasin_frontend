import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StoresFormClient from '@/components/pages/magasin/stores/stores-form';
import { AUTH_LOGIN, STORES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editStoreTitle, description: t.metadata.editStoreDescription };
}

const StoreEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(STORES_LIST);
	}

	return <StoresFormClient session={session} id={Number(id)} />;
};

export default StoreEditPage;
