/** A document is queued, rather than unsuccessfully generated. */
export class PdfTranslationDeferredError extends Error {
	constructor() {
		super('pdf_translation_deferred');
		this.name = 'PdfTranslationDeferredError';
	}
}

export const showPdfError = (
	error: unknown,
	onError: (message: string) => void,
	onInfo: ((message: string) => void) | undefined,
	pendingMessage: string,
	fallbackMessage: string,
) => {
	if (error instanceof PdfTranslationDeferredError) (onInfo ?? onError)(pendingMessage);
	else onError(fallbackMessage);
};
