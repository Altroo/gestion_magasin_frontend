import type { StoreScopedIdPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import AttendanceFormClient from '@/components/pages/magasin/attendance/attendance-form';
import { ATTENDANCE_LIST, AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editAttendanceTitle, description: t.metadata.editAttendanceDescription };
}

const AttendanceEditPage = async ({ params, searchParams }: StoreScopedIdPageProps) => {
	const session = await auth();
	const { id } = await params;
	const { store_id } = await searchParams;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id)) || (store_id && isNaN(Number(store_id)))) redirect(ATTENDANCE_LIST);
	return <AttendanceFormClient session={session} id={Number(id)} storeId={store_id ? Number(store_id) : undefined} />;
};

export default AttendanceEditPage;
