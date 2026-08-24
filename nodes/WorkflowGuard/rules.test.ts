import assert from 'node:assert/strict';
import test from 'node:test';

import { checkRule, evaluateRules, getPath, type GuardRule } from './rules';

const rule = (partial: Partial<GuardRule>): GuardRule =>
	({ field: 'email', condition: 'exists', ...partial }) as GuardRule;

test('getPath walks nested objects', () => {
	assert.equal(getPath({ a: { b: { c: 1 } } }, 'a.b.c'), 1);
	assert.equal(getPath({ a: 1 }, 'a.b.c'), undefined);
	assert.equal(getPath(null, 'a'), undefined);
});

test('exists distinguishes missing from falsy', () => {
	assert.equal(checkRule({ email: '' }, rule({})), null);
	assert.match(String(checkRule({}, rule({}))), /missing/);
});

test('notEmpty rejects whitespace-only values', () => {
	const r = rule({ condition: 'notEmpty' });
	assert.equal(checkRule({ email: 'x' }, r), null);
	assert.match(String(checkRule({ email: '   ' }, r)), /empty/);
});

test('isEmail accepts ordinary addresses and rejects malformed ones', () => {
	const r = rule({ condition: 'isEmail' });
	assert.equal(checkRule({ email: 'a@b.co' }, r), null);
	assert.ok(checkRule({ email: 'a@b' }, r));
	assert.ok(checkRule({ email: 'no-at-sign.com' }, r));
});

test('isNumber does not coerce empty strings or booleans', () => {
	const r = rule({ field: 'qty', condition: 'isNumber' });
	assert.equal(checkRule({ qty: '42' }, r), null);
	assert.equal(checkRule({ qty: 3.5 }, r), null);
	assert.ok(checkRule({ qty: '' }, r));
	assert.ok(checkRule({ qty: true }, r));
});

test('regex reports invalid patterns instead of throwing', () => {
	const r = rule({ field: 'sku', condition: 'regex', pattern: '[' });
	assert.match(String(checkRule({ sku: 'x' }, r)), /invalid pattern/);
});

test('isDate accepts timestamps and rejects bare years', () => {
	const r = rule({ field: 'due', condition: 'isDate' });
	assert.equal(checkRule({ due: '2026-08-25' }, r), null);
	assert.equal(checkRule({ due: '2026-08-25T09:14:02Z' }, r), null);
	assert.ok(checkRule({ due: '2026' }, r), 'a bare year is a mis-typed field');
	assert.ok(checkRule({ due: 'not a date' }, r));
	assert.ok(checkRule({ due: '' }, r));
});

test('isOneOf compares as strings and reports the allowed set', () => {
	const r = rule({ field: 'status', condition: 'isOneOf', allowed: ['open', 'closed'] });
	assert.equal(checkRule({ status: 'open' }, r), null);
	assert.match(String(checkRule({ status: 'draft' }, r)), /open, closed/);
});

test('isOneOf with no allowed list is reported, not silently passed', () => {
	const r = rule({ field: 'status', condition: 'isOneOf' });
	assert.match(String(checkRule({ status: 'x' }, r)), /no allowed values/);
});

test('evaluateRules collects every violation', () => {
	const violations = evaluateRules({ email: 'bad' }, [
		rule({ condition: 'isEmail' }),
		rule({ field: 'name', condition: 'exists' }),
	]);
	assert.equal(violations.length, 2);
});
