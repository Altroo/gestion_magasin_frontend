import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import StockTransfersFormClient from '@/components/pages/magasin/stock-transfers/stock-transfers-form';
import { AUTH_LOGIN, STOCK_TRANSFERS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editStockTransferTitle, description: t.metadata.editStockTransferDescription };
}

const StockTransferEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(STOCK_TRANSFERS_LIST);

	return <StockTransfersFormClient session={session} id={Number(id)} />;
};

export default StockTransferEditPage;
