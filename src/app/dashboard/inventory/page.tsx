import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import InventoryListClient from '@/components/pages/magasin/inventory/inventory-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.inventoryTitle, description: t.metadata.inventoryDescription };
}

const InventoryPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <InventoryListClient session={session} />;
};

export default InventoryPage;
