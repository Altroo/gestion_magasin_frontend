import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PurchasesListClient from '@/components/pages/magasin/purchases/purchases-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.purchasesTitle, description: t.metadata.purchasesDescription };
}

const PurchasesPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <PurchasesListClient session={session} />;
};

export default PurchasesPage;
