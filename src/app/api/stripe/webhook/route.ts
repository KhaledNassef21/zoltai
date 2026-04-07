import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  premium: boolean;
  createdAt: string;
  lastLogin: string;
  stripeCustomerId?: string;
  premiumSince?: string;
}

function getUsers(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveUsers(users: User[]) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function upgradeToPremium(email: string, stripeCustomerId: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.email === email);
  if (user) {
    user.premium = true;
    user.stripeCustomerId = stripeCustomerId;
    user.premiumSince = new Date().toISOString();
    saveUsers(users);
    return true;
  }
  return false;
}

function downgradeFromPremium(stripeCustomerId: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.stripeCustomerId === stripeCustomerId);
  if (user) {
    user.premium = false;
    saveUsers(users);
    return true;
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
        const session = event.data.object;
        const email = (session as any).customer_email || (session as any).metadata?.userEmail;
        const customerId = (session as any).customer as string;
        if (email && customerId) {
          const upgraded = upgradeToPremium(email, customerId);
          console.log(`Premium ${upgraded ? "activated" : "failed"} for ${email}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = (subscription as any).customer as string;
        if (customerId) {
          const downgraded = downgradeFromPremium(customerId);
          console.log(`Premium ${downgraded ? "canceled" : "cancel failed"} for customer ${customerId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log(`Payment failed for customer ${(invoice as any).customer}`);
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
