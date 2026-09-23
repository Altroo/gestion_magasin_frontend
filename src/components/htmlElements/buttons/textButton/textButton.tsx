import { type FC, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import Styles from './textButton.module.sass';

type Props = {
	buttonText: string;
	startIcon?: ReactNode;
	onClick?: () => void;
	cssClass?: string;
	disabled?: boolean;
	children?: ReactNode;
};

const TextButton: FC<Props> = (props: Props) => {
	return (
		<Button
			className={`${Styles.button} ${props.cssClass && `${props.cssClass}`}`}
			disabled={props.disabled}
			onClick={props.onClick}
			variant="text"
			startIcon={props.startIcon}
		>
			{props.buttonText}
		</Button>
	);
};

export default TextButton;
