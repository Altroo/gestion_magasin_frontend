import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';
import CatalogClient from '@/components/pages/magasin/catalog/catalog-list';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.catalogTitle, description: t.metadata.catalogDescription };
}

const CatalogPage = async () => {
	const session = await auth();
	if (!session) {
		redirect(AUTH_LOGIN);
	}
	return <CatalogClient session={session} />;
};

export default CatalogPage;
