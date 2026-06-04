import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, USERS_LIST } from '@/utils/routes';
import UsersViewClient from '@/components/pages/users/users-view';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.userDetailsTitle, description: t.metadata.userDetailsDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const UserDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(USERS_LIST);
	}

	return <UsersViewClient session={session} id={Number(id)} />;
};

export default UserDetailPage;
