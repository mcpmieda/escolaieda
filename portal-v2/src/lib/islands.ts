import type { IslandRegistry } from '@tinacms/astro/experimental';
import HomeBody from '../components/HomeBody.astro';
import { getHome } from './home-data';

export const islands: IslandRegistry = {
  home: {
    fetch: () => getHome(),
    component: HomeBody,
    wrapper: { tag: 'main' },
    propsFromData: (result) => ({
      content: (result as any).data?.home,
    }),
  },
};
