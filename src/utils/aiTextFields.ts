// Only reviewed writing fields get AI. Unknown fields stay unchanged by default.
const writingFields = new Set(['observations', 'label', 'title', 'note']);

export const isAiTextField = (name: string, type: string) =>
	(type === 'text' || type === 'textarea') && writingFields.has(name);
