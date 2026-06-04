import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import StockTransfersFormClient from '@/components/pages/magasin/stock-transfers/stock-transfers-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newStockTransferTitle, description: t.metadata.newStockTransferDescription };
}

const StockTransferNewPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <StockTransfersFormClient session={session} />;
};

export default StockTransferNewPage;
