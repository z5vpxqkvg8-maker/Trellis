// app/engagement/[engagementId]/ssk-swot/page.tsx

import { redirect } from "next/navigation";

type Params = { engagementId: string };

type PageProps = {
  params: Params | Promise<Params>;
};

export default async function LegacySskSwotPage(props: PageProps) {
  const rawParams =
    props.params instanceof Promise ? await props.params : props.params;
  const { engagementId } = rawParams;

  redirect(`/engagement/${encodeURIComponent(engagementId)}/review-input`);
}
