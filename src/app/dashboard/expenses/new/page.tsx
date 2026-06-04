import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ExpensesFormClient from '@/components/pages/magasin/expenses/expenses-form';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newExpenseTitle, description: t.metadata.newExpenseDescription };
}

const ExpenseNewPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);

	return <ExpensesFormClient session={session} />;
};

export default ExpenseNewPage;
