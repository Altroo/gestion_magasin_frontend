'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from '@/utils/hooks';

interface PortalProps {
	id: string;
	children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ id, children }) => {
	const isClient = useIsClient();

	useEffect(() => {
		if (!isClient) return;

		// Get or create container
		let el = document.getElementById(id);
		if (!el) {
			el = document.createElement('div');
			el.id = id;

			el.style.position = 'fixed';
			el.style.bottom = '20px';
			el.style.left = '20px';
			el.style.zIndex = '9999';
			el.style.width = 'auto';
			el.style.maxWidth = '100vw';
			el.style.pointerEvents = 'none';
			el.style.display = 'flex';
			el.style.flexDirection = 'column';
			el.style.alignItems = 'flex-start';

			document.body.appendChild(el);
		}

		// Cleanup
		return () => {
			if (el && el.childNodes.length === 0 && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		};
	}, [id, isClient]);

	// Don't render on server or before client hydration
	if (!isClient) return null;

	const container = document.getElementById(id);
	if (!container) return null;

	return createPortal(children, container);
};

export default Portal;
