import { redirect } from 'next/navigation';
import { DASHBOARD_NOTIFICATIONS } from '@/utils/routes';

const NotificationsPage = async () => {
	redirect(DASHBOARD_NOTIFICATIONS);
};

export default NotificationsPage;
