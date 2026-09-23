import type { NumericIdPageProps } from '@/types/routeTypes';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import PurchasesFormClient from '@/components/pages/magasin/purchases/purchases-form';
import { AUTH_LOGIN, PURCHASES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editPurchaseTitle, description: t.metadata.editPurchaseDescription };
}

const PurchaseEditPage = async ({ params }: NumericIdPageProps) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(PURCHASES_LIST);

	return <PurchasesFormClient session={session} id={Number(id)} />;
};

export default PurchaseEditPage;
