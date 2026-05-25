const proc = Bun.spawn(['bun', '--filter', '@agent-manager/desktop', 'dev'], {
	env: {
		...Bun.env,
		SMOKE: 'true',
	},
	stdout: 'inherit',
	stderr: 'inherit',
});

process.exit(await proc.exited);
