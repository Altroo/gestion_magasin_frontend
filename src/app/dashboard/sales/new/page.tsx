import type { StoreSearchPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import SalesFormClient from '@/components/pages/magasin/sales/sales-form';
import { AUTH_LOGIN, SALES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newSaleTitle, description: t.metadata.newSaleDescription };
}

const SalesNewPage = async ({ searchParams }: StoreSearchPageProps) => {
	const session = await auth();
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (store_id && isNaN(Number(store_id))) {
		redirect(SALES_LIST);
	}

	return <SalesFormClient session={session} storeId={store_id ? Number(store_id) : undefined} />;
};

export default SalesNewPage;
