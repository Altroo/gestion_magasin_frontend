import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StockFormClient from '@/components/pages/magasin/stock/stock-form';
import { AUTH_LOGIN, STOCK_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	searchParams: Promise<{ store_id?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newStockTitle, description: t.metadata.newStockDescription };
}

const StockNewPage = async ({ searchParams }: PageProps) => {
	const session = await auth();
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (store_id && isNaN(Number(store_id))) {
		redirect(STOCK_LIST);
	}

	return <StockFormClient session={session} storeId={store_id ? Number(store_id) : undefined} />;
};

export default StockNewPage;
