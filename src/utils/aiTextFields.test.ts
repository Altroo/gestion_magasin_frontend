import { isAiTextField } from './aiTextFields';
describe('AI text eligibility', () => {
	it.each(['designation', 'description', 'notes', 'client_nom', 'st_lot_description', 'remarque'])(
		'enables prose: %s',
		(name) => expect(isAiTextField(name, 'text')).toBe(true),
	);
	it.each([
		'reference',
		'prix_vente',
		'numero_contrat',
		'montant',
		'stock',
		'email',
		'rib',
		'client_cin',
		'client_cp',
		'code',
		'search',
		'date_facture',
	])('excludes identifiers and measured values: %s', (name) => expect(isAiTextField(name, 'text')).toBe(false));
	it.each(['number', 'date', 'email', 'password', 'checkbox'])('excludes input type %s', (type) =>
		expect(isAiTextField('description', type)).toBe(false),
	);
});
