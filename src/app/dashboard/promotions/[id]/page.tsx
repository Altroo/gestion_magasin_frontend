import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsViewClient from '@/components/pages/magasin/promotions/promotions-view';
import { AUTH_LOGIN, PROMOTIONS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.promotionDetailsTitle, description: t.metadata.promotionDetailsDescription };
}

const PromotionViewPage = async ({ params }: PageProps) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(PROMOTIONS_LIST);
	}

	return <PromotionsViewClient session={session} id={Number(id)} />;
};

export default PromotionViewPage;
