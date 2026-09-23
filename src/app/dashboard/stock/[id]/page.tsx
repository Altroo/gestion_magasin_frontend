import type { StockDetailPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StockViewClient from '@/components/pages/magasin/stock/stock-view';
import { AUTH_LOGIN, STOCK_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.stockDetailsTitle, description: t.metadata.stockDetailsDescription };
}

const StockViewPage = async ({ params, searchParams }: StockDetailPageProps) => {
	const session = await auth();
	const { id } = await params;
	const { source, store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || (store_id && isNaN(Number(store_id)))) {
		redirect(STOCK_LIST);
	}

	return (
		<StockViewClient
			session={session}
			id={Number(id)}
			storeId={store_id ? Number(store_id) : undefined}
			source={source === 'store-stock' ? 'store-stock' : undefined}
		/>
	);
};

export default StockViewPage;
