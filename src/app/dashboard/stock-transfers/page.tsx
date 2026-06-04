import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StockTransfersListClient from '@/components/pages/magasin/stock-transfers/stock-transfers-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.stockTransfersTitle, description: t.metadata.stockTransfersDescription };
}

const StockTransfersPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <StockTransfersListClient session={session} />;
};

export default StockTransfersPage;
