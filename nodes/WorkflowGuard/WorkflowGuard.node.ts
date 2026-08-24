import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { evaluateRules, type GuardRule } from './rules';

/**
 * Workflow Guard validates items mid-run and decides what happens to the ones
 * that fail. Without it every workflow here repeats the same IF/Stop-and-Error
 * pair, and a malformed webhook payload takes the whole execution down.
 */
export class WorkflowGuard implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Workflow Guard',
		name: 'workflowGuard',
		icon: 'fa:shield-alt',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["onFailure"]}}',
		description: 'Validate incoming items against rules and route or reject the failures',
		defaults: { name: 'Workflow Guard' },
		inputs: ['main'],
		outputs: ['main', 'main'],
		outputNames: ['Passed', 'Failed'],
		properties: [
			{
				displayName: 'Rules',
				name: 'rules',
				placeholder: 'Add Rule',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				options: [
					{
						name: 'rule',
						displayName: 'Rule',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'string',
								default: '',
								description: 'Dot path into the item, e.g. customer.email',
								required: true,
							},
							{
								displayName: 'Condition',
								name: 'condition',
								type: 'options',
								default: 'exists',
								options: [
									{ name: 'Exists', value: 'exists' },
									{ name: 'Is Not Empty', value: 'notEmpty' },
									{ name: 'Is Email', value: 'isEmail' },
									{ name: 'Is Number', value: 'isNumber' },
									{ name: 'Matches Regex', value: 'regex' },
								],
							},
							{
								displayName: 'Pattern',
								name: 'pattern',
								type: 'string',
								default: '',
								displayOptions: { show: { condition: ['regex'] } },
								description: 'Regular expression the value must match',
							},
						],
					},
				],
			},
			{
				displayName: 'On Failure',
				name: 'onFailure',
				type: 'options',
				default: 'route',
				options: [
					{
						name: 'Route to Failed Output',
						value: 'route',
						description: 'Send failing items down the second output',
					},
					{
						name: 'Throw Error',
						value: 'throw',
						description: 'Stop the execution on the first failing item',
					},
					{
						name: 'Drop Silently',
						value: 'drop',
						description: 'Discard failing items and continue',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const passed: INodeExecutionData[] = [];
		const failed: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const onFailure = this.getNodeParameter('onFailure', i) as string;
			const collection = this.getNodeParameter('rules', i, {}) as { rule?: GuardRule[] };
			const rules = collection.rule ?? [];

			const violations = evaluateRules(items[i].json, rules);
			if (violations.length === 0) {
				passed.push(items[i]);
				continue;
			}

			if (onFailure === 'throw') {
				throw new NodeOperationError(
					this.getNode(),
					`Item ${i} failed validation: ${violations.join('; ')}`,
					{ itemIndex: i },
				);
			}
			if (onFailure === 'route') {
				failed.push({
					json: { ...items[i].json, __violations: violations },
					pairedItem: { item: i },
				});
			}
			// 'drop' falls through, discarding the item entirely.
		}

		return [passed, failed];
	}
}
