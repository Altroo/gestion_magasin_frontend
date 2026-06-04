import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ExpensesViewClient from '@/components/pages/magasin/expenses/expenses-view';
import { AUTH_LOGIN, EXPENSES_LIST } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.expenseDetailsTitle, description: t.metadata.expenseDetailsDescription };
}

const ExpenseViewPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(EXPENSES_LIST);

	return <ExpensesViewClient session={session} id={Number(id)} />;
};

export default ExpenseViewPage;
