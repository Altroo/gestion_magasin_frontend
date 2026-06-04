import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsListClient from '@/components/pages/magasin/promotions/promotions-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.promotionsTitle, description: t.metadata.promotionsDescription };
}

const PromotionsPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PromotionsListClient session={session} />;
};

export default PromotionsPage;
