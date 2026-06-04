import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsFormClient from '@/components/pages/magasin/promotions/promotions-form';
import { AUTH_LOGIN, PROMOTIONS_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ store_id?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editPromotionTitle, description: t.metadata.editPromotionDescription };
}

const PromotionEditPage = async ({ params, searchParams }: PageProps) => {
	const session = await auth();
	const { id } = await params;
	const { store_id } = await searchParams;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id)) || (store_id && isNaN(Number(store_id)))) {
		redirect(PROMOTIONS_LIST);
	}

	return <PromotionsFormClient session={session} id={Number(id)} storeId={store_id ? Number(store_id) : undefined} />;
};

export default PromotionEditPage;
