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

    // Get user from auth API instead of parsing token directly
    const cookieStore = await cookies();
    const userToken = cookieStore.get("user_token")?.value;

    if (!userToken) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    // Fetch user data from auth endpoint internally
    // We need to get the email from the users file
    const fs = await import("fs");
    const path = await import("path");
    const usersFile = path.join(process.cwd(), "data/users.json");

    let userEmail = "";
    try {
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
        // We can't access the session store from here, so we'll rely on the cookie being valid
        // The actual user verification happens via GET /api/auth
        // For checkout, we do a server-side auth check
        const authRes = await fetch(new URL("/api/auth", req.nextUrl.origin), {
          headers: { Cookie: `user_token=${userToken}` },
        });
        const authData = await authRes.json();
        if (!authData.user?.email) {
          return NextResponse.json(
            { error: "Please log in again" },
            { status: 401 }
          );
        }
        userEmail = authData.user.email;
      }
    } catch {
      return NextResponse.json(
        { error: "Authentication error. Please log in again." },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Please log in first" },
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
