import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server not configured — SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  let body: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    jenis_jualan?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, password, role, jenis_jualan } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "name, email, password and role are required." },
      { status: 400 }
    );
  }

  const validRoles = ["admin", "vendor", "user"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${validRoles.join(", ")}.` },
      { status: 400 }
    );
  }

  // Create the user via admin API — email_confirm: true skips the verification email
  const { data: createData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

  if (createError) {
    const isExisting =
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("exists") ||
      createError.code === "email_exists";

    return NextResponse.json(
      { error: isExisting ? "An account with this email already exists." : createError.message },
      { status: isExisting ? 409 : 400 }
    );
  }

  const userId = createData.user.id;
  let vendorId: string | null = null;

  // ── If registering as vendor, create a vendor record ────────────────────────
  if (role === "vendor") {
    vendorId = userId; // Use auth UUID as vendor ID for a clean 1:1 mapping

    const { error: vendorError } = await supabaseAdmin
      .from("vendor")
      .upsert(
        {
          id: vendorId,
          nama_perniagaan: name,
          jenis_jualan: jenis_jualan?.trim() || "Belum ditetapkan",
          email,
          status: "AKTIF",
        },
        { onConflict: "id" }
      );

    if (vendorError) {
      console.error("[register] vendor create error:", vendorError);
      // Non-fatal — auth account was created; vendor can update their profile later
    }
  }

  // ── Upsert profile row (service role bypasses RLS) ───────────────────────────
  const { error: upsertError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        name,
        email,
        role,
        vendor_id: vendorId,
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    console.error("[register] profile upsert error:", upsertError);
    // Non-fatal — auth account was created, profile can be synced later
  }

  return NextResponse.json({ success: true, userId, vendorId });
}
