import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import CatalogFormClient from '@/components/pages/magasin/catalog/catalog-form';
import { AUTH_LOGIN, CATALOG_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	searchParams: Promise<{ store_id?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newProductTitle, description: t.metadata.newProductDescription };
}

const CatalogNewPage = async ({ searchParams }: PageProps) => {
	const session = await auth();
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (store_id && isNaN(Number(store_id))) {
		redirect(CATALOG_LIST);
	}

	return <CatalogFormClient session={session} storeId={store_id ? Number(store_id) : undefined} />;
};

export default CatalogNewPage;
