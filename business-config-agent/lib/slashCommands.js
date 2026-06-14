/** Built-in slash commands — mirrors the original BA frontend. */
export const SLASH_COMMANDS = [
    { name: 'help', type: 'action', group: 'workspace', label: '/help', description: 'Show all available slash commands' },
    { name: 'new', type: 'action', group: 'workspace', label: '/new', description: 'Start a new chat' },
    { name: 'clear', type: 'action', group: 'workspace', label: '/clear', description: 'Clear the current chat' },
    {
        name: 'compact', type: 'prompt', group: 'workspace', label: '/compact',
        description: 'Summarize & compact conversation context',
        prompt: 'Summarize all key findings, decisions, file paths, and conclusions from this conversation in a concise structured format. Focus on what was discovered, what was validated, and what outputs were produced so far.',
    },
    {
        name: 'scan', type: 'prompt', group: 'sub-agents', label: '/scan',
        description: 'Inspect config workbook structure (config_inspector)',
        prompt: 'Inspect this config workbook and catalog all its sheets, structure, row counts, and any obvious structural issues.',
    },
    {
        name: 'validate', type: 'prompt', group: 'sub-agents', label: '/validate',
        description: 'Validate a QA or COMP config workbook (validation_analyst)',
        prompt: 'Validate this config workbook and report the PASS/FAIL verdict, all errors grouped by sheet, and suggested fixes.',
    },
    {
        name: 'transforms', type: 'prompt', group: 'sub-agents', label: '/transforms',
        description: 'Explain FieldOperations transforms (transform_analyst)',
        prompt: 'Analyze and explain all the FieldOperations transforms in this config workbook. Flag any rows with missing inputs or parameters.',
    },
    {
        name: 'reconcile', type: 'prompt', group: 'sub-agents', label: '/reconcile',
        description: 'Reconcile COMP completeness gaps (completeness_reconciler)',
        prompt: 'Reconcile input vs output completeness for this COMP control. Surface missing keys, duplicate keys, and coverage gaps.',
    },
    {
        name: 'report', type: 'prompt', group: 'sub-agents', label: '/report',
        description: 'Write a full analysis report to the sandbox (report_writer)',
        prompt: 'Write a full summary report of the current analysis findings and save it to the sandbox.',
    },
    {
        name: 'profile', type: 'prompt', group: 'data', label: '/profile',
        description: 'Profile input data and flag risky columns',
        prompt: 'Profile my input data and flag the columns that look risky.',
    },
    {
        name: 'inspect', type: 'prompt', group: 'data', label: '/inspect',
        description: 'Inspect input files and give a full data summary',
        prompt: 'Inspect the input files and give me a full data summary.',
    },
    {
        name: 'pipeline', type: 'prompt', group: 'workflow', label: '/pipeline',
        description: 'Full end-to-end analysis pipeline',
        prompt: 'Run the full analysis pipeline on the config workbook: (1) inspect structure, (2) validate all rules, (3) analyze FieldOperations transforms, (4) check completeness if this is a COMP control, and (5) write a polished report to the sandbox.',
    },
    {
        name: 'status', type: 'prompt', group: 'workflow', label: '/status',
        description: 'List sandbox output files and session progress',
        prompt: 'List all files currently in my sandbox and give me a brief summary of what has been produced so far in this session.',
    },
    {
        name: 'summarize', type: 'prompt', group: 'workflow', label: '/summarize',
        description: 'Summarize conversation findings in bullet points',
        prompt: 'Summarize the key findings, decisions, and outputs from this conversation so far in 5 bullet points or fewer.',
    },
    {
        name: 'checklist', type: 'prompt', group: 'workflow', label: '/checklist',
        description: 'Produce a prioritized fix checklist',
        prompt: 'Review the current config workbook and produce a numbered checklist of all items that need to be fixed, ordered by severity.',
    },
    {
        name: 'retry', type: 'prompt', group: 'workflow', label: '/retry',
        description: 'Retry the last failed step with a different approach',
        prompt: 'Review the last error or failed action in this conversation and try a different approach to fix it.',
    },
];

export const GROUP_META = {
    workspace: { label: 'Workspace', color: '#6366f1', bg: '#eef2ff' },
    'sub-agents': { label: 'Sub-agents', color: '#7c3aed', bg: '#f5f3ff' },
    data: { label: 'Data', color: '#0369a1', bg: '#f0f9ff' },
    workflow: { label: 'Workflow', color: '#065f46', bg: '#d1fae5' },
    skill: { label: 'Skill', color: '#92400e', bg: '#fef3c7' },
};

export const SUB_AGENTS = [
    { name: 'config_inspector', label: 'Config Inspector', slash: '/scan', description: 'Catalog workbook sheets and structure' },
    { name: 'validation_analyst', label: 'Validation Analyst', slash: '/validate', description: 'PASS/FAIL config validation' },
    { name: 'transform_analyst', label: 'Transform Analyst', slash: '/transforms', description: 'Explain FieldOperations transforms' },
    { name: 'completeness_reconciler', label: 'Completeness Reconciler', slash: '/reconcile', description: 'Reconcile COMP input/output gaps' },
    { name: 'report_writer', label: 'Report Writer', slash: '/report', description: 'Write analysis reports to sandbox' },
];

export function groupCommands(cmds) {
    const groups = {};
    const order = [];
    for (const cmd of cmds) {
        const g = cmd.group || 'skill';
        if (!groups[g]) { groups[g] = []; order.push(g); }
        groups[g].push(cmd);
    }
    return order.map(g => ({ group: g, commands: groups[g] }));
}

export function buildHelpText(dynamicCommands) {
    const groups = [
        { label: 'Workspace', names: ['help', 'new', 'clear', 'compact'] },
        { label: 'Sub-agents', names: ['scan', 'validate', 'transforms', 'reconcile', 'report'] },
        { label: 'Data', names: ['profile', 'inspect'] },
        { label: 'Workflow harness', names: ['pipeline', 'status', 'summarize', 'checklist', 'retry'] },
    ];
    const cmdMap = Object.fromEntries(SLASH_COMMANDS.map(c => [c.name, c]));
    const sections = groups.map(({ label, names }) => {
        const rows = names.map(n => cmdMap[n]).filter(Boolean)
            .map(c => `| \`${c.label}\` | ${c.description} |`).join('\n');
        return `**${label}**\n\n| Command | Description |\n|---|---|\n${rows}`;
    }).join('\n\n');
    const dynamicSection = dynamicCommands.length > 0
        ? `\n\n**Skills loaded from input folder**\n\n| Command | Description |\n|---|---|\n${
            dynamicCommands.map(c => `| \`${c.label}\` | ${c.description} |`).join('\n')
        }`
        : '';
    return `## Slash commands\n\n${sections}${dynamicSection}\n\n> Type \`/\` to open the picker · arrows to navigate · Enter or Tab to select · Esc to dismiss`;
}
