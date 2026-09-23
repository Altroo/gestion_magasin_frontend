import type { ReactNode } from 'react';

export type NumericIdPageProps = {
	params: Promise<{ id: string }>;
};

export type StoreSearchPageProps = {
	searchParams: Promise<{ store_id?: string }>;
};

export type StoreScopedIdPageProps = NumericIdPageProps & StoreSearchPageProps;

export type StockDetailPageProps = NumericIdPageProps & {
	searchParams: Promise<{ source?: string; store_id?: string }>;
};

export type RootLayoutProps = {
	children: ReactNode;
};
