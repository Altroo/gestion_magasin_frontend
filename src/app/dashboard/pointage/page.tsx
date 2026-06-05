import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';
import AttendanceClient from '@/components/pages/magasin/attendance/attendance-list';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.attendanceTitle, description: t.metadata.attendanceDescription };
}

const AttendancePage = async () => {
	const session = await auth();
	if (!session) {
		redirect(AUTH_LOGIN);
	}
	return <AttendanceClient session={session} />;
};

export default AttendancePage;
