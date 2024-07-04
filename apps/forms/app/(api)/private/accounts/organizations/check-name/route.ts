import { workspaceclient } from "@/lib/supabase/server";
import { isValidUsername, messages } from "@/services/utils/username";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { value } = await req.json();
  const { data, error } = await workspaceclient
    .from("organization")
    .select("name")
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
