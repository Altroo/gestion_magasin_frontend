import { type FC, type ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { CircularProgress, Backdrop } from '@mui/material';

type Props = {
	cssStyle?: CSSProperties;
	children?: ReactNode;
	backdropColor: string;
	circularColor: string;
	backdropOpen?: boolean;
};

// '#FFFFFF'
const ApiProgress: FC<Props> = (props: Props) => {
	return (
		<Backdrop
			sx={{ backgroundColor: props.backdropColor, zIndex: (theme) => theme.zIndex.drawer + 1 }}
			open={props.backdropOpen ?? true}
		>
			<CircularProgress data-testid="api-loader" sx={{ color: props.circularColor }} />
		</Backdrop>
	);
};

export default ApiProgress;
