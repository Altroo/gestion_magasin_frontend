// A page hint, never authorization. The API rechecks every selected store.
type StoreHint = { pathname: string; owner: number; storeId: number };
let activeStore: StoreHint | null = null;
const listeners = new Set<() => void>();
export const publishChatAIStore = (hint: StoreHint) => {
	activeStore = hint;
	listeners.forEach((notify) => notify());
	return () => {
		if (activeStore === hint) {
			activeStore = null;
			listeners.forEach((notify) => notify());
		}
	};
};
export const getChatAIStore = () => activeStore;
export const subscribeChatAIStore = (notify: () => void) => {
	listeners.add(notify);
	return () => {
		listeners.delete(notify);
	};
};
