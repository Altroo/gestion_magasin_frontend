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

const isStoreTabVisible = (membership: StoreMembershipType) =>
	membership.is_active &&
	membership.store.is_active &&
	!membership.store.is_global_stock &&
	membership.store.code !== 'mbr-south';

export const useSelectedStore = (token?: string) => {
	const { data = [], isLoading } = useGetMyStoresQuery(undefined, { skip: !token });
	const visibleMemberships = useMemo(() => data.filter(isStoreTabVisible), [data]);
	const defaultStore = visibleMemberships[0]?.store;
	const globalStore = data.find((membership) => membership.is_active && membership.store.is_active && membership.store.is_global_stock)?.store;
	return {
		memberships: visibleMemberships,
		defaultStore,
		globalStore,
		isLoading,
	};
};

const StoreTabs = ({ selectedStoreId, onChange, token }: Props) => {
	const { t } = useLanguage();
	const { data = [] } = useGetMyStoresQuery(undefined, { skip: !token });

	const stores = useMemo(
		() => data.filter(isStoreTabVisible).map((membership) => membership.store),
		[data],
	);
	const visibleActiveStoreId = selectedStoreId ?? stores[0]?.id;

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
				value={visibleActiveStoreId ?? false}
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
