import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../tina/__generated__/client';

export const getHome = () =>
  requestWithMetadata(
    client.queries.home({ relativePath: 'home.json' }),
    { priority: 'primary' },
  );

export type CmsHome = Awaited<ReturnType<typeof getHome>>['data']['home'];
