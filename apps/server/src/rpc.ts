import { os } from '@orpc/server';
import fs from 'fs';
import path from 'path';

export type GrokSession = {
	path: string;
	summary: unknown;
};

export type GrokProjectSessions = {
	path: string;
	name: string;
	sessions: GrokSession[];
};

const grokProjectsDir = path.join(process.env.HOME!, '.grok', 'sessions');

const listDir = async (root: string) => (await fs.promises.readdir(root)).map(x => path.join(root, x));

async function listSessions(): Promise<GrokProjectSessions[]> {
	const result: GrokProjectSessions[] = [];
	const projects = (await listDir(grokProjectsDir)).filter(x => fs.statSync(x).isDirectory());

	for (const dir of projects) {
		result.push({
			path: dir,
			name: decodeURIComponent(dir)
				.slice(grokProjectsDir.length + 1)
				.replace(process.env.HOME! + path.sep, ''),
			sessions: await Promise.all(
				(await listDir(dir))
					.filter(x => fs.statSync(x).isDirectory())
					.map(async dir => ({
						path: dir,
						summary: JSON.parse((await fs.promises.readFile(path.join(dir, 'summary.json'))).toString()),
					})),
			),
		});
	}

	return result;
}

export const router = {
	sessions: {
		list: os.handler(async () => listSessions()),
	},
};

export type AppRouter = typeof router;
