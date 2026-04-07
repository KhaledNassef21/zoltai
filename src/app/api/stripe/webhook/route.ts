import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

function getUsers(): Record<string, any> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveUsers(users: Record<string, any>) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function upgradeToPremium(email: string, stripeCustomerId: string) {
  const users = getUsers();
  // Find user by email
  for (const [id, user] of Object.entries(users)) {
    if ((user as any).email === email) {
      (user as any).premium = true;
      (user as any).stripeCustomerId = stripeCustomerId;
      (user as any).premiumSince = new Date().toISOString();
      users[id] = user;
      saveUsers(users);
      return true;
    }
  }
  return false;
}

function downgradeFromPremium(stripeCustomerId: string) {
  const users = getUsers();
  for (const [id, user] of Object.entries(users)) {
    if ((user as any).stripeCustomerId === stripeCustomerId) {
      (user as any).premium = false;
      users[id] = user;
      saveUsers(users);
      return true;
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const email = session.customer_email || session.metadata?.userEmail;
        const customerId = session.customer;
        if (email && customerId) {
          upgradeToPremium(email, customerId);
          console.log(`Premium activated for ${email}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        if (customerId) {
          downgradeFromPremium(customerId);
          console.log(`Premium canceled for customer ${customerId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log(`Payment failed for customer ${invoice.customer}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
