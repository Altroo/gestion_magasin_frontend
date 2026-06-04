'use client';

import { useEffect } from 'react';
import { cookiesDeleter } from '@/utils/apiHelpers';

const ClearCookiesClient = () => {
	useEffect(() => {
		cookiesDeleter('/api/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		}).catch(() => {
			// Continue with the flow even if cookie deletion fails
		});
	}, []);

	return null;
};

export default ClearCookiesClient;
