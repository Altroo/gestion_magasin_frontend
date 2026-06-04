import { type Metadata } from 'next';
import ResetPasswordClient from '@/components/pages/auth/reset-password/resetPassword';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.resetPasswordTitle };
}

const ResetPasswordPage = () => <ResetPasswordClient />;

export default ResetPasswordPage;
