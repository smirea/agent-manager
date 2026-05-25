const proc = Bun.spawn(['bun', '--filter', '@agent-manager/desktop', 'dev'], {
	env: {
		...process.env,
		SMOKE: '1',
	},
	stdout: 'inherit',
	stderr: 'inherit',
});

process.exit(await proc.exited);
