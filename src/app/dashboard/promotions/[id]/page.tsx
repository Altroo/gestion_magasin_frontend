import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsViewClient from '@/components/pages/magasin/promotions/promotions-view';
import { AUTH_LOGIN, PROMOTIONS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ store_id?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.promotionDetailsTitle, description: t.metadata.promotionDetailsDescription };
}

const PromotionViewPage = async ({ params, searchParams }: PageProps) => {
	const session = await auth();
	const { id } = await params;
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || (store_id && isNaN(Number(store_id)))) {
		redirect(PROMOTIONS_LIST);
	}

	return <PromotionsViewClient session={session} id={Number(id)} storeId={store_id ? Number(store_id) : undefined} />;
};

export default PromotionViewPage;
