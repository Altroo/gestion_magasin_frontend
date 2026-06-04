import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import AttendanceFormClient from '@/components/pages/magasin/attendance/attendance-form';
import { ATTENDANCE_LIST, AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

type PageProps = { searchParams: Promise<{ store_id?: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newAttendanceTitle, description: t.metadata.newAttendanceDescription };
}

const AttendanceNewPage = async ({ searchParams }: PageProps) => {
	const session = await auth();
	const { store_id } = await searchParams;
	if (!session) redirect(AUTH_LOGIN);
	if (store_id && isNaN(Number(store_id))) redirect(ATTENDANCE_LIST);
	return <AttendanceFormClient session={session} storeId={store_id ? Number(store_id) : undefined} />;
};

export default AttendanceNewPage;
