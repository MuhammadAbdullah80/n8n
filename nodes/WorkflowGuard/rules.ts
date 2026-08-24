/**
 * Rule evaluation for the Workflow Guard node, kept free of any n8n imports so
 * it can be unit-tested and reasoned about on its own.
 */

/** One configured validation rule as the node UI produces it. */
export interface GuardRule {
	field: string;
	condition: 'exists' | 'notEmpty' | 'isEmail' | 'isNumber' | 'regex' | 'isDate' | 'isOneOf';
	pattern?: string;
	/** Allowed values for `isOneOf`, compared as strings. */
	allowed?: string[];
}

/**
 * Deliberately conservative: one @, a dot in the domain, and no whitespace.
 * Full RFC 5322 is not worth the false negatives on real signup data.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads a dot-separated path out of a nested object.
 *
 * @returns the value, or `undefined` if any segment is missing
 */
export function getPath(source: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((current, segment) => {
		if (current === null || typeof current !== 'object') return undefined;
		return (current as Record<string, unknown>)[segment];
	}, source);
}

/**
 * Checks one rule against an item.
 *
 * @returns a human-readable violation message, or `null` when the rule passes
 */
export function checkRule(item: unknown, rule: GuardRule): string | null {
	const value = getPath(item, rule.field);

	switch (rule.condition) {
		case 'exists':
			return value === undefined ? `${rule.field} is missing` : null;

		case 'notEmpty':
			return value === undefined || value === null || String(value).trim() === ''
				? `${rule.field} is empty`
				: null;

		case 'isEmail':
			return typeof value === 'string' && EMAIL.test(value)
				? null
				: `${rule.field} is not a valid email`;

		case 'isNumber':
			// Reject empty strings, which Number() would happily coerce to 0.
			return typeof value !== 'boolean' &&
				value !== null &&
				String(value).trim() !== '' &&
				Number.isFinite(Number(value))
				? null
				: `${rule.field} is not a number`;

		case 'isDate': {
			// Date.parse accepts a lot, but a bare integer year like 2024 parsing
			// as a date is nearly always a mis-typed field rather than intent.
			if (typeof value === 'number' || value === null || value === undefined) {
				return `${rule.field} is not a date`;
			}
			const text = String(value).trim();
			if (text === '' || /^\d+$/.test(text)) {
				return `${rule.field} is not a date`;
			}
			return Number.isNaN(Date.parse(text)) ? `${rule.field} is not a date` : null;
		}

		case 'isOneOf': {
			if (!rule.allowed?.length) {
				return `${rule.field} has an isOneOf rule with no allowed values`;
			}
			return rule.allowed.includes(String(value))
				? null
				: `${rule.field} is not one of ${rule.allowed.join(', ')}`;
		}

		case 'regex': {
			if (!rule.pattern) return `${rule.field} has a regex rule with no pattern`;
			let expression: RegExp;
			try {
				expression = new RegExp(rule.pattern);
			} catch {
				return `${rule.field} has an invalid pattern: ${rule.pattern}`;
			}
			return typeof value === 'string' && expression.test(value)
				? null
				: `${rule.field} does not match ${rule.pattern}`;
		}

		default:
			return `${rule.field} has an unknown condition`;
	}
}

/** Runs every rule against one item and collects the failures. */
export function evaluateRules(item: unknown, rules: GuardRule[]): string[] {
	return rules
		.map((rule) => checkRule(item, rule))
		.filter((message): message is string => message !== null);
}
