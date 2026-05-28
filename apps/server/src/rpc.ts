import { ORPCError, os } from '@orpc/server';
import { promiseAllObject } from '@repo/shared';
import type { GrokSessionUpdateJsonMessage } from '@repo/shared';
import fs from 'fs';
import path from 'path';
import z from 'zod';

export type GrokSession = {
	id: string;
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

async function listProjects(): Promise<GrokProjectSessions[]> {
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
					.map(async dir => {
						const summary = JSON.parse(await fs.promises.readFile(path.join(dir, 'summary.json'), 'utf8'));
						return {
							id: summary.info.id,
							path: dir,
							summary,
						};
					}),
			),
		});
	}

	return result;
}

// TODO: this does not scale to massive fooken files
const readJsonL = async <T extends unknown>(filePath: string) =>
	(await fs.promises.readFile(filePath, 'utf8'))
		.split('\n')
		.filter(Boolean)
		.map(line => JSON.parse(line) as T);

export const router = {
	sessions: {
		list: os.handler(async () => listProjects()),
		get: os.input(z.object({ id: z.uuid() })).handler(async ({ input }) => {
			const projects = await listProjects();
			const match = projects
				.map(x => x.sessions)
				.flat()
				.find(x => x.id === input.id);
			if (!match) throw new ORPCError(`session.id="${input.id}" not found`);
			return {
				...match,
				...(await promiseAllObject({
					system: fs.promises.readFile(path.join(match.path, 'system_prompt.txt'), 'utf8'),
					updates: (
						await readJsonL<GrokSessionUpdateJsonMessage>(path.join(match.path, 'updates.jsonl'))
					).map(message => {
						// delete (message.params.update as any)._meta;
						return { ...message.params.update, _meta: message.params._meta };
					}),
				})),
			};
		}),
	},
};

export type AppRouter = typeof router;
