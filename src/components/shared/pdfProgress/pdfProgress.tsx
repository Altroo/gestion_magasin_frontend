'use client';
import { useSyncExternalStore } from 'react';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { subscribePdfRequests, getPendingPdfRequests, getServerPendingPdfRequests } from '@/utils/apiHelpers';

export default function PdfProgress() {
	const pending = useSyncExternalStore(subscribePdfRequests, getPendingPdfRequests, getServerPendingPdfRequests);
	return pending > 0 ? <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" /> : null;
}
