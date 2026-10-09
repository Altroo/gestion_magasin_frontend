import { type ReactNode } from 'react';
import AppUpdate from '@/components/shared/appUpdate/appUpdate';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<section>
			<AppUpdate />
			{children}
		</section>
	);
};

export default DashboardLayout;
