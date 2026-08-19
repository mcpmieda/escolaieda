import type { IslandRegistry } from "@tinacms/astro/experimental";
import type { QueryResult } from "@tinacms/astro/data";
import type { PageQuery } from "../../tina/__generated__/types";
import type { CmsPage } from "./data";
import PageBody from "../components/islands/PageBody.astro";
import { getPage } from "./data";

export const islands: IslandRegistry = {
  page: {
    fetch: (_request, params) => getPage(params.get("slug") ?? "home"),
    component: PageBody,
    wrapper: { tag: "main" },
    propsFromData: (data) => ({
      data: (data as QueryResult<PageQuery>).data?.page as CmsPage | undefined,
    }),
  },
};
