export async function promiseAllObject<Data extends Record<string, any>>(
	data: Data,
): Promise<{
	[K in keyof Data]: Data[K] extends Promise<any>
		? Awaited<Data[K]>
		: Data[K] extends (...args: any[]) => any
			? Awaited<ReturnType<Data[K]>>
			: Data[K];
}> {
	const result: Record<string, any> = {};
	await Promise.all(
		Object.entries(data).map(async ([k, v]) => {
			let p = typeof v === 'function' ? v() : v;
			result[k] = await p;
		}),
	);
	return result as any;
}
