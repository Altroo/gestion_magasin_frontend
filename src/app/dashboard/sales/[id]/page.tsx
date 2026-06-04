import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import SalesViewClient from '@/components/pages/magasin/sales/sales-view';
import { AUTH_LOGIN, SALES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.saleDetailsTitle, description: t.metadata.saleDetailsDescription };
}

const SalesViewPage = async ({ params }: PageProps) => {
	const session = await auth();
	const { id } = await params;
	if (!session) {
		redirect(AUTH_LOGIN);
	}
	if (!id || isNaN(Number(id))) {
		redirect(SALES_LIST);
	}
	return <SalesViewClient session={session} id={Number(id)} />;
};

export default SalesViewPage;
