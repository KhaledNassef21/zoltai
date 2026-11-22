import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from Zoltai emails.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string; done?: string }>;
}) {
  const { e = "", t = "", done } = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
      <h1 className="text-3xl font-bold mb-4">Unsubscribe</h1>
      {done ? (
        <p className="text-zinc-400">
          You are unsubscribed. You will not get any more emails from Zoltai.
        </p>
      ) : e && t ? (
        <form action="/api/unsubscribe" method="POST" className="space-y-6">
          <input type="hidden" name="e" value={e} />
          <input type="hidden" name="t" value={t} />
          <p className="text-zinc-400">
            Stop all Zoltai emails to <strong className="text-zinc-200">{e}</strong>?
          </p>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500"
          >
            Yes, unsubscribe me
          </button>
        </form>
      ) : (
        <p className="text-zinc-400">
          This unsubscribe link is not valid. Please use the link in the latest
          email you got from Zoltai.
        </p>
      )}
    </div>
  );
}
