import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import InventoryFormClient from '@/components/pages/magasin/inventory/inventory-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newInventoryTitle, description: t.metadata.newInventoryDescription };
}

const InventoryNewPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);

	return <InventoryFormClient session={session} />;
};

export default InventoryNewPage;
