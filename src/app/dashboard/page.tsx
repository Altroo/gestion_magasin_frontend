import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, DASHBOARD_POS } from '@/utils/routes';

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	redirect(DASHBOARD_POS);
};

export default DashboardPage;
