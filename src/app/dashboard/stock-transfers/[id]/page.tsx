import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StockTransfersViewClient from '@/components/pages/magasin/stock-transfers/stock-transfers-view';
import { AUTH_LOGIN, STOCK_TRANSFERS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.stockTransferDetailsTitle, description: t.metadata.stockTransferDetailsDescription };
}

const StockTransferViewPage = async ({ params }: PageProps) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(STOCK_TRANSFERS_LIST);
	return <StockTransfersViewClient session={session} id={Number(id)} />;
};

export default StockTransferViewPage;
