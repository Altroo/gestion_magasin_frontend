import { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { usePermission, useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { usePathname } from 'next/navigation';
import { isPointageOnlyPathAllowed } from '@/utils/pointageOnlyAccess';

type PermissionKey =
	| 'is_staff'
	| 'pointage_only'
	| 'can_view'
	| 'can_print'
	| 'can_create'
	| 'can_edit'
	| 'can_delete'
	| 'can_create_promotion'
	| 'can_wholesale_sale';

interface ProtectedProps {
	children: ReactNode;
	permission?: PermissionKey;
	allow?: boolean;
}

export const Protected = (props: ProtectedProps) => {
	const permissions = usePermission();
	const profil = useAppSelector(getProfilState);
	const pathname = usePathname();
	const required = props.permission ?? 'is_staff';

	// Wait for profile to load before evaluating permissions — avoids false "Accès Refusé" on fresh page loads
	if (!profil.id) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					py: 8,
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (profil.pointage_only && !isPointageOnlyPathAllowed(pathname)) {
		return <NoPermission />;
	}

	if (!props.allow && !permissions[required]) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
