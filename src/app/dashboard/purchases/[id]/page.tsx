import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PurchasesViewClient from '@/components/pages/magasin/purchases/purchases-view';
import { AUTH_LOGIN, PURCHASES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.purchaseDetailsTitle, description: t.metadata.purchaseDetailsDescription };
}

const PurchaseViewPage = async ({ params }: PageProps) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(PURCHASES_LIST);
	return <PurchasesViewClient session={session} id={Number(id)} />;
};

export default PurchaseViewPage;
