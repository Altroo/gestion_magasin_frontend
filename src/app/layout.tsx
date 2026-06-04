import React from 'react';
import type { Metadata, Viewport } from 'next';
import '@/styles/globals.sass';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import SessionProvider from '@/providers/sessionProvider';
import StoreProvider from '@/providers/storeProvider';
import type { AppProps } from 'next/app';
import { InitContextProvider } from '@/contexts/InitContext';
import ThemeProvider from '@/providers/themeProvider';
import { InitEffects } from '@/contexts/initEffects';
import { ToastContextProvider } from '@/contexts/toastContext';
import { ErrorBoundary } from '@/components/shared/errorBoundary';
import SessionExpiredListener from '@/components/shared/sessionExpiredListener/sessionExpiredListener';
import { LanguageContextProvider } from '@/contexts/languageContext';
import Maintenance from '@/components/shared/maintenance/Maintenance';
import { getServerTranslations } from '@/utils/serverTranslations';
import { cookies } from 'next/headers';

export const generateMetadata = async (): Promise<Metadata> => {
	const t = await getServerTranslations();
	return {
		title: t.metadata.appTitle,
		applicationName: t.metadata.appTitle,
		authors: [{ name: 'Altroo' }],
		robots: {
			index: false,
			follow: false,
		},
		manifest: '/assets/ico/manifest.json',
		icons: {
			icon: [
				{ url: '/assets/ico/favicon.ico', rel: 'shortcut icon' },
				{ url: '/assets/ico/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
				{ url: '/assets/ico/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
				{ url: '/assets/ico/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
				{ url: '/assets/ico/android-icon-36x36.png', sizes: '36x36', type: 'image/png' },
				{ url: '/assets/ico/android-icon-48x48.png', sizes: '48x48', type: 'image/png' },
				{ url: '/assets/ico/android-icon-72x72.png', sizes: '72x72', type: 'image/png' },
				{ url: '/assets/ico/android-icon-96x96.png', sizes: '96x96', type: 'image/png' },
				{ url: '/assets/ico/android-icon-144x144.png', sizes: '144x144', type: 'image/png' },
				{ url: '/assets/ico/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
			],
			apple: [
				{ url: '/assets/ico/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
				{ url: '/assets/ico/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
			],
		},
		other: {
			'msapplication-TileColor': '#ffffff',
			'msapplication-TileImage': '/assets/ico/ms-icon-144x144.png',
			copyright: `Copyright - ${t.metadata.appTitle} © ${new Date().getFullYear()}`,
			rating: 'general',
			expires: 'never',
		},
	};
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1.0,
	themeColor: '#ffffff',
};

interface EntryPointProps extends AppProps {
	children: React.ReactNode;
}

const RootLayout: React.FC<EntryPointProps> = async (props) => {
	const t = await getServerTranslations();
	const cookieStore = await cookies();
	const lang = cookieStore.get('app-language')?.value === 'en' ? 'en' : 'fr';
	return (
		<html lang={lang} data-scroll-behavior="smooth">
			<body>
				<a href="#main-content" className="skip-to-content">
					{t.common.skipToContent}
				</a>
				<SessionProvider>
					<StoreProvider>
						<InitContextProvider>
							<InitEffects />
							<AppRouterCacheProvider>
								<ThemeProvider>
									<LanguageContextProvider initialLanguage={lang}>
										<ErrorBoundary>
											<ToastContextProvider>
												<SessionExpiredListener />
												<Maintenance />
												<div id="main-content">{props.children}</div>
											</ToastContextProvider>
										</ErrorBoundary>
									</LanguageContextProvider>
								</ThemeProvider>
							</AppRouterCacheProvider>
						</InitContextProvider>
					</StoreProvider>
				</SessionProvider>
			</body>
		</html>
	);
};

export default RootLayout;
