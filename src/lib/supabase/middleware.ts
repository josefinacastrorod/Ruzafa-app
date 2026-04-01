import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMiddlewareAuthState(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createSupabaseServerClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    response,
  };
}
