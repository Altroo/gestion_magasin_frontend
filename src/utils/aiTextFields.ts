// Identifiers and measured values are not prose, even if their HTML input type is text.
const nonTextField =
	/(^|[._-])(id|rc|if|cin|cp|postal|zip|siret|vat|email|password|confirm_password|current_password|new_password|telephone|phone|tel|gsm|fax|url|site_web|website|ice|cnss|rib|iban|swift|bic|reference|ref|code|numero|number|quantity|quantite|prix|price|montant|amount|total|tva|tax|tax_professionnelle|identifiant|registre|compte|pourcentage|percentage|remise|discount|taux|rate|search|recherche|filter|filtre|date|year|annee|duration|delai|days|jours|stock|surface|area|count|nbr|poids|weight|volume)([._-]|$)/i;
export const isAiTextField = (name: string, type: string) =>
	(type === 'text' || type === 'textarea') &&
	!nonTextField.test(name.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_'));
