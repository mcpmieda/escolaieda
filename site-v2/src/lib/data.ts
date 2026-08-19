import { requestWithMetadata } from "@tinacms/astro/data";
import client from "../../tina/__generated__/client";

export const getPage = (slug: string) =>
  requestWithMetadata(client.queries.page({ relativePath: `${slug}.json` }), { priority: "primary" });

export type CmsPage = Awaited<ReturnType<typeof getPage>>["data"]["page"];
export type PageBlock = NonNullable<NonNullable<CmsPage["blocks"]>[number]>;
export type HeroBlock = Extract<PageBlock, { __typename: "PageBlocksHero" }>;
export type QuickLinksBlock = Extract<PageBlock, { __typename: "PageBlocksQuickLinks" }>;
export type NoticeBlock = Extract<PageBlock, { __typename: "PageBlocksNotice" }>;
export type StatsBlock = Extract<PageBlock, { __typename: "PageBlocksStats" }>;
