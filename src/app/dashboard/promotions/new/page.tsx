import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsFormClient from '@/components/pages/magasin/promotions/promotions-form';
import { AUTH_LOGIN, PROMOTIONS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	searchParams: Promise<{ store_id?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newPromotionTitle, description: t.metadata.newPromotionDescription };
}

const PromotionNewPage = async ({ searchParams }: PageProps) => {
	const session = await auth();
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (store_id && isNaN(Number(store_id))) {
		redirect(PROMOTIONS_LIST);
	}

	return <PromotionsFormClient session={session} storeId={store_id ? Number(store_id) : undefined} />;
};

export default PromotionNewPage;
