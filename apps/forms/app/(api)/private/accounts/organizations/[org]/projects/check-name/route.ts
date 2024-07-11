import { createRouteHandlerWorkspaceClient } from "@/lib/supabase/server";
import { isValidUsername, messages } from "@/services/utils/username";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: {
    params: {
      org: string;
    };
  }
) {
  const cookieStore = cookies();

  const org = context.params.org;

  const wsclient = createRouteHandlerWorkspaceClient(cookieStore);

  const { data: orgref, error: orgerr } = await wsclient
    .from("organization")
    .select("id, name")
    .eq("name", org)
    .single();

  if (orgerr) {
    console.error(orgerr);
    return notFound();
  }

  if (!orgref) {
    return notFound();
  }

  const { value } = await req.json();

  const { data, error } = await wsclient
    .from("project")
    .select("name")
    .eq("organization_id", orgref.id)
    .ilike("name", value)
    // do not add single() as it will throw error when no rows are found - use limit(1) instead - (this is actually not needed)
    .limit(1);

  if (error) {
    console.error(error);
    return NextResponse.error();
  }

  const available = data.length === 0;
  const valid = isValidUsername(value);

  return NextResponse.json({
    ok: available && valid,
    message: available
      ? valid
        ? messages.available
        : messages.invalid
      : messages.taken,
  });
}
