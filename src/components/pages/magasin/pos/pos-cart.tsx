'use client';

import { Box, IconButton, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	DeleteOutlined as DeleteIcon,
	LocalOffer as LocalOfferIcon,
	Remove as RemoveIcon,
} from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import type { CartLine } from './pos-form';

type Props = {
	cart: CartLine[];
	lineKey: (line: CartLine) => string;
	onUpdateQuantity: (key: string, delta: number) => void;
	onRemove: (key: string) => void;
};

const money = (value: number | string) => `${Number(value || 0).toFixed(2)} Dhs`;

const PosCart = ({ cart, lineKey, onUpdateQuantity, onRemove }: Props) => {
	const { t } = useLanguage();

	if (!cart.length) {
		return (
			<Box
				sx={{
					height: '100%',
					minHeight: 150,
					display: 'grid',
					placeItems: 'center',
					textAlign: 'center',
					color: 'text.secondary',
					border: '1px dashed',
					borderColor: 'divider',
					borderRadius: 2,
				}}
			>
				<Stack spacing={0.5} sx={{ alignItems: 'center' }}>
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{t.magasin.emptyCart}
					</Typography>
					<Typography variant="body2">{t.magasin.scanFirstProduct}</Typography>
				</Stack>
			</Box>
		);
	}

	return (
		<Stack spacing={1} role="list" aria-label={t.magasin.cart}>
			{cart.map((line) => {
				const key = lineKey(line);
				const isProduct = line.type === 'product';
				const name = isProduct ? line.product.name : line.promotion.name;
				const reference = isProduct
					? (line.product.reference ?? line.product.barcode ?? t.magasin.product)
					: t.magasin.promotion;
				return (
					<Box
						key={key}
						role="listitem"
						sx={{
							display: 'grid',
							gridTemplateColumns: 'minmax(0, 1fr) auto auto',
							alignItems: 'center',
							gap: { xs: 0.75, sm: 1 },
							minHeight: 76,
							p: 1.25,
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: 2,
							bgcolor: 'background.paper',
						}}
					>
						<Box sx={{ minWidth: 0 }}>
							<Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
								{!isProduct && <LocalOfferIcon color="primary" sx={{ fontSize: 17, flexShrink: 0 }} />}
								<Typography noWrap sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
									{name}
								</Typography>
							</Stack>
							<Typography noWrap variant="caption" sx={{ color: 'text.secondary' }}>
								{reference} · {money(line.unitPrice)}
							</Typography>
						</Box>
						<Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
							<IconButton
								type="button"
								onClick={() => onUpdateQuantity(key, -1)}
								aria-label={t.magasin.decreaseQuantity}
								sx={{ width: 56, height: 56, border: '1px solid', borderColor: 'divider' }}
							>
								<RemoveIcon />
							</IconButton>
							<Typography sx={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
								{line.quantity}
							</Typography>
							<IconButton
								type="button"
								onClick={() => onUpdateQuantity(key, 1)}
								aria-label={t.magasin.increaseQuantity}
								sx={{ width: 56, height: 56, border: '1px solid', borderColor: 'divider' }}
							>
								<AddIcon />
							</IconButton>
						</Stack>
						<Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
							<Typography
								sx={{
									minWidth: { xs: 88, sm: 110 },
									textAlign: 'right',
									fontWeight: 800,
									fontSize: { xs: '0.82rem', sm: '0.95rem' },
									whiteSpace: 'nowrap',
								}}
							>
								{money(line.quantity * line.unitPrice)}
							</Typography>
							<IconButton
								type="button"
								color="error"
								onClick={() => onRemove(key)}
								aria-label={t.common.delete}
								sx={{ width: 56, height: 56 }}
							>
								<DeleteIcon />
							</IconButton>
						</Stack>
					</Box>
				);
			})}
		</Stack>
	);
};

export default PosCart;
