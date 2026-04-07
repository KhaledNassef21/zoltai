import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStripe, PREMIUM_PRICE_ID } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    if (!PREMIUM_PRICE_ID) {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please contact support." },
        { status: 503 }
      );
    }

    // Get user from cookie
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    // Parse user data from token (base64 JSON)
    let userEmail = "";
    try {
      const decoded = JSON.parse(
        Buffer.from(userToken, "base64").toString("utf-8")
      );
      userEmail = decoded.email || "";
    } catch {
      return NextResponse.json(
        { error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/premium?success=true`,
      cancel_url: `${req.nextUrl.origin}/premium?canceled=true`,
      metadata: {
        userEmail,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
