import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import InventoryViewClient from '@/components/pages/magasin/inventory/inventory-view';
import { AUTH_LOGIN, INVENTORY_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.inventoryDetailsTitle, description: t.metadata.inventoryDetailsDescription };
}

const InventoryViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(INVENTORY_LIST);

	return <InventoryViewClient session={session} id={Number(id)} />;
};

export default InventoryViewPage;
