import { Suspense, type ReactNode } from 'react';
import { ChatAIAssistant } from '@/components/chat-ai/ChatAIAssistant';
import AppUpdate from '@/components/shared/appUpdate/appUpdate';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<section>
			<AppUpdate />
			{children}
			<Suspense fallback={null}>
				<ChatAIAssistant />
			</Suspense>
		</section>
	);
};

export default DashboardLayout;
