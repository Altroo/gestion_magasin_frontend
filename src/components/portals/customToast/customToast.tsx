import { type Dispatch, type FC, type ReactNode, type SetStateAction, type SyntheticEvent, type Ref } from 'react';
import { Stack, Snackbar, ThemeProvider, Slide } from '@mui/material';
import type { SlideProps } from '@mui/material/Slide';
import Styles from './customToast.module.sass';
import MuiAlert, { AlertProps, AlertColor } from '@mui/material/Alert';
import { customToastTheme } from '@/utils/themes';
import {
	CheckCircle as CheckCircleIcon,
	Error as ErrorIcon,
	Info as InfoIcon,
	WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';

type Props = {
	type: AlertColor;
	show: boolean;
	setShow: Dispatch<SetStateAction<boolean>>;
	message: string;
	children?: ReactNode;
};

const Alert = ({ ref, ...props }: AlertProps & { ref?: Ref<HTMLDivElement> }) => {
	return <MuiAlert elevation={6} ref={ref} variant="outlined" {...props} />;
};

const TransitionUp = (props: SlideProps) => <Slide {...props} direction="up" />;

const CustomToast: FC<Props> = (props) => {
	const { type } = props;

	const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') return;
		props.setShow(false);
	};
	return (
		<ThemeProvider theme={customToastTheme()}>
			<Stack spacing={2} className={Styles.rootStack}>
				<Snackbar
					style={{ width: 'calc(100vw - 32px)', maxWidth: '560px' }}
					open={props.show}
					autoHideDuration={6000}
					onClose={handleClose}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
					slots={{ transition: TransitionUp }}
				>
					<Alert
						onClose={handleClose}
						severity={type}
						className={Styles.alert}
						iconMapping={{
							success: <CheckCircleIcon className={Styles.alertIcon} color="success" />,
							error: <ErrorIcon className={Styles.alertIcon} color="error" />,
							info: <InfoIcon className={Styles.alertIcon} color="info" />,
							warning: <WarningAmberIcon className={Styles.alertIcon} color="warning" />,
						}}
					>
						{props.message}
					</Alert>
				</Snackbar>
			</Stack>
		</ThemeProvider>
	);
};

export default CustomToast;
