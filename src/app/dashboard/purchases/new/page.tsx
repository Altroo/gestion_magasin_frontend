import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PurchasesFormClient from '@/components/pages/magasin/purchases/purchases-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newPurchaseTitle, description: t.metadata.newPurchaseDescription };
}

const PurchaseNewPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <PurchasesFormClient session={session} />;
};

export default PurchaseNewPage;
