import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';

const SSOStartPage = () => {
	const centralAuthorizeUrl = process.env.NEXT_PUBLIC_EBH_SSO_AUTHORIZE_URL;
	const appSlug = process.env.NEXT_PUBLIC_EBH_SSO_APP_SLUG;
	const appUrl = process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX;

	if (!centralAuthorizeUrl || !appSlug || !appUrl) {
		redirect('/login?error=SSOConfiguration');
	}

	const params = new URLSearchParams({
		app: appSlug,
		redirect_uri: `${appUrl}/sso/callback`,
		state: randomUUID(),
	});

	redirect(`${centralAuthorizeUrl}?${params.toString()}`);
};

export default SSOStartPage;
