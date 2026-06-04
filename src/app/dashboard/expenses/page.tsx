import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import ExpensesListClient from '@/components/pages/magasin/expenses/expenses-list';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.expensesTitle, description: t.metadata.expensesDescription };
}

const ExpensesPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ExpensesListClient session={session} />;
};

export default ExpensesPage;
