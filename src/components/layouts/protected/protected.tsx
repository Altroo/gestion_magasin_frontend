import { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { usePermission, useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import NoPermission from '@/components/shared/noPermission/noPermission';

type PermissionKey =
	| 'is_staff'
	| 'can_view'
	| 'can_print'
	| 'can_create'
	| 'can_edit'
	| 'can_delete'
	| 'can_create_promotion';

interface ProtectedProps {
	children: ReactNode;
	permission?: PermissionKey;
}

export const Protected = (props: ProtectedProps) => {
	const permissions = usePermission();
	const profil = useAppSelector(getProfilState);
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

	if (!permissions[required]) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
