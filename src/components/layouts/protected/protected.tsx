import { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { usePermission, useAppSelector } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import NoPermission from '@/components/shared/noPermission/noPermission';
import { usePathname } from 'next/navigation';

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

	const pointagePathAllowed =
		pathname.startsWith('/dashboard/pointage') ||
		(profil.default_password_set && pathname === '/dashboard/settings/password');
	if (profil.pointage_only && !pointagePathAllowed) {
		return <NoPermission />;
	}

	if (!permissions[required]) {
		return <NoPermission />;
	}

	return <>{props.children}</>;
};
