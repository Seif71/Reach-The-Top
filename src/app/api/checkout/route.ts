import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/checkout";
import { isPaymentsReady } from "@/lib/stripe";
import { listingInputSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!isPaymentsReady()) {
    return NextResponse.json(
      { error: "Payments are not configured. Add Stripe keys to continue." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = listingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid bid" },
      { status: 400 },
    );
  }

  const session = await auth();
  const result = await createCheckoutSession({
    ...parsed.data,
    userId: session?.user?.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    url: result.url,
    advertiserId: result.advertiserId,
  });
}
