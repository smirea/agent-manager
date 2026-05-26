import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '@repo/server/rpc';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

const link = new RPCLink({
	url: () => `${window.location.origin}/api/rpc`,
});

export const client: RouterClient<AppRouter> = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
