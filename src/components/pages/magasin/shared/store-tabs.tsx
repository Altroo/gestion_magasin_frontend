'use client';

import { Alert, Box, Tab, Tabs } from '@mui/material';
import { useMemo } from 'react';
import { useGetMyStoresQuery } from '@/store/services/magasin';
import { useLanguage } from '@/utils/hooks';
import type { StoreMembershipType } from '@/types/gestionMagasinTypes';

type Props = {
	selectedStoreId?: number;
	onChange: (storeId: number) => void;
	token?: string;
};

export const useSelectedStore = (token?: string) => {
	const { data = [], isLoading } = useGetMyStoresQuery(undefined, { skip: !token });
	const defaultStore = data[0]?.store;
	return {
		memberships: data,
		defaultStore,
		isLoading,
	};
};

const StoreTabs = ({ selectedStoreId, onChange, token }: Props) => {
	const { t } = useLanguage();
	const { data = [] } = useGetMyStoresQuery(undefined, { skip: !token });
	const activeStoreId = selectedStoreId ?? data[0]?.store.id;

	const stores = useMemo(
		() =>
			data
				.filter((membership: StoreMembershipType) => membership.is_active && membership.store.is_active)
				.map((membership) => membership.store),
		[data],
	);

	if (!stores.length) {
		return <Alert severity="warning">{t.errors.accessDeniedText}</Alert>;
	}

	return (
		<Box
			sx={{
				width: '100%',
				borderBottom: 1,
				borderColor: 'divider',
				mb: 2,
				bgcolor: 'background.paper',
			}}
		>
			<Tabs
				value={activeStoreId ?? false}
				onChange={(_, value: number) => onChange(value)}
				variant="scrollable"
				allowScrollButtonsMobile
				scrollButtons="auto"
				aria-label={t.magasin.store}
				sx={{
					'& .MuiTabs-indicator': {
						height: 3,
						borderRadius: '3px 3px 0 0',
					},
					'& .MuiTab-root': {
						textTransform: 'none',
						fontSize: '0.95rem',
						fontWeight: 500,
						minHeight: 56,
						px: 3,
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: 'action.hover',
						},
						'&.Mui-selected': {
							fontWeight: 600,
						},
					},
					'& .MuiTabs-scrollButtons.Mui-disabled': {
						opacity: 0.3,
					},
				}}
			>
				{stores.map((store) => (
					<Tab key={store.id} value={store.id} label={store.name} />
				))}
			</Tabs>
		</Box>
	);
};

export default StoreTabs;
