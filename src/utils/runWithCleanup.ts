export const runWithCleanup = async <T>(action: () => Promise<T>, cleanup: () => void | Promise<void>): Promise<T> => {
	try {
		return await action();
	} finally {
		await cleanup();
	}
};

export const runAsyncWithErrorHandler = async <T>(
	action: () => Promise<T>,
	onError: (error: unknown) => T | Promise<T>,
): Promise<T> => {
	try {
		return await action();
	} catch (error) {
		return await onError(error);
	}
};
