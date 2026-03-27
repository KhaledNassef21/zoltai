import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface WeeklyReport {
  totalPosts: number;
  newPostsThisWeek: number;
  topPosts: { title: string; slug: string }[];
  seoInsights: string;
  instagramStats: string;
  gscIssues: string;
}

export async function sendWeeklyReport(report: WeeklyReport): Promise<void> {
  const emailTo = process.env.REPORT_EMAIL_TO;
  const emailFrom = process.env.RESEND_FROM_EMAIL || "Zoltai <reports@zoltai.ai>";

  if (!emailTo) {
    throw new Error("REPORT_EMAIL_TO not configured");
  }

  const topPostsHtml = report.topPosts
    .map((p) => `<li><a href="https://zoltai.ai/blog/${p.slug}">${p.title}</a></li>`)
    .join("\n");

  await resend.emails.send({
    from: emailFrom,
    to: emailTo,
    subject: `Zoltai Weekly Report - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ededed; padding: 32px; border-radius: 12px;">
        <h1 style="color: #7c3aed; font-size: 24px;">Zoltai Weekly Report</h1>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #a78bfa;">Content Overview</h2>
          <p>Total articles: <strong>${report.totalPosts}</strong></p>
          <p>New this week: <strong>${report.newPostsThisWeek}</strong></p>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #a78bfa;">Top Posts</h2>
          <ul>${topPostsHtml}</ul>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #a78bfa;">SEO Insights</h2>
          <p>${report.seoInsights}</p>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #a78bfa;">Instagram</h2>
          <p>${report.instagramStats}</p>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: #111; border-radius: 8px;">
          <h2 style="font-size: 18px; color: #a78bfa;">Search Console Issues</h2>
          <p>${report.gscIssues}</p>
        </div>

        <hr style="border-color: #1e1e1e; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px; text-align: center;">
          Automated report by Zoltai AI
        </p>
      </div>
    `,
  });
}
