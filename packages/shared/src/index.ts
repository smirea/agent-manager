export type Agent = {
	id: string;
	name: string;
	command: string;
	status: 'idle' | 'running';
};

export type HealthResponse = {
	ok: true;
	runtime: 'bun';
	now: string;
	workspace: string;
};

export type AgentEvent =
	| {
			type: 'connected';
			now: string;
	  }
	| {
			type: 'heartbeat';
			now: string;
	  }
	| {
			type: 'command.finished';
			command: string;
			output: string;
			exitCode: number;
			now: string;
	  };
