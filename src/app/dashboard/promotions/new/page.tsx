import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import PromotionsFormClient from '@/components/pages/magasin/promotions/promotions-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newPromotionTitle, description: t.metadata.newPromotionDescription };
}

const PromotionNewPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <PromotionsFormClient session={session} />;
};

export default PromotionNewPage;
