'use client';

import React, { createContext, useState } from 'react';
import type { AlertColor } from '@mui/material';
import Portal from '@/contexts/portal';
import CustomToast from '@/components/portals/customToast/customToast';

export type ToastContextType = {
	onSuccess: (msg: string) => void;
	onError: (msg: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [show, setShow] = useState<boolean>(false);
	const [type, setType] = useState<AlertColor>('success');
	const [message, setMessage] = useState<string>('');

	const onSuccess = (msg: string) => {
		setType('success');
		setMessage(msg);
		setShow(true);
	};

	const onError = (msg: string) => {
		setType('error');
		setMessage(msg);
		setShow(true);
	};

	return (
		<ToastContext.Provider value={{ onSuccess, onError }}>
			{children}
			<Portal id="snackbar_portal">
				<CustomToast type={type} message={message} setShow={setShow} show={show} />
			</Portal>
		</ToastContext.Provider>
	);
};
