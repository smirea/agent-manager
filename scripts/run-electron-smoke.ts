const proc = Bun.spawn(['bun', '--filter', '@agent-manager/desktop', 'dev'], {
	env: {
		...process.env,
		AGENT_MANAGER_SMOKE: '1',
	},
	stdout: 'inherit',
	stderr: 'inherit',
});

process.exit(await proc.exited);
