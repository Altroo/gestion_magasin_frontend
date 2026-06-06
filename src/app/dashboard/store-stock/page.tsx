import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StoreStockOverviewClient from '@/components/pages/magasin/store-stock/store-stock-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.storeStockTitle, description: t.metadata.storeStockDescription };
}

const StoreStockOverviewPage = async () => {
	const session = await auth();
	if (!session) {
		redirect(AUTH_LOGIN);
	}
	return <StoreStockOverviewClient session={session} />;
};

export default StoreStockOverviewPage;
