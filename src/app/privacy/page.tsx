import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Zoltai privacy policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-10">
        Last updated: April 7, 2026
      </p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-zinc-400 leading-relaxed">
            Zoltai (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates
            the website zoltai.org. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our
            website. Please read this policy carefully. By using the site, you
            agree to the collection and use of information in accordance with
            this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. Information We Collect
          </h2>
          <h3 className="text-lg font-medium mt-4 mb-2">
            Personal Information
          </h3>
          <p className="text-zinc-400 leading-relaxed">
            We may collect personal information that you voluntarily provide
            when you:
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>Subscribe to our newsletter (name, email address)</li>
            <li>Create an account (name, email, password)</li>
            <li>Leave a comment on blog posts</li>
            <li>Contact us via email</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">
            Automatically Collected Information
          </h3>
          <p className="text-zinc-400 leading-relaxed">
            When you visit our site, we may automatically collect:
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
            <li>IP address (anonymized)</li>
            <li>Device information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside text-zinc-400 space-y-1">
            <li>Send you our newsletter and AI tool guides</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Improve our website content and user experience</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Prevent spam and abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            4. Cookies and Tracking
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            We use cookies and similar tracking technologies to enhance your
            experience. These include:
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>
              <strong className="text-zinc-300">Essential cookies:</strong>{" "}
              Required for site functionality (authentication, preferences)
            </li>
            <li>
              <strong className="text-zinc-300">Analytics cookies:</strong>{" "}
              Help us understand how visitors use our site
            </li>
            <li>
              <strong className="text-zinc-300">Preference cookies:</strong>{" "}
              Remember your language and theme settings
            </li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-2">
            You can control cookies through your browser settings. Disabling
            certain cookies may affect site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
          <p className="text-zinc-400 leading-relaxed">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>
              <strong className="text-zinc-300">Resend:</strong> Email delivery
              for newsletters and notifications
            </li>
            <li>
              <strong className="text-zinc-300">Vercel:</strong> Website hosting
              and analytics
            </li>
            <li>
              <strong className="text-zinc-300">Google Search Console:</strong>{" "}
              SEO performance monitoring
            </li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-2">
            These services may collect data in accordance with their own privacy
            policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Affiliate Links</h2>
          <p className="text-zinc-400 leading-relaxed">
            Our site contains affiliate links to third-party products and
            services. When you click these links, the third-party site may
            collect information about you according to their privacy policy. We
            may earn a commission from purchases made through these links, at no
            additional cost to you. We only recommend tools we have reviewed and
            believe provide genuine value.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
          <p className="text-zinc-400 leading-relaxed">
            We implement reasonable security measures to protect your personal
            information. However, no method of transmission over the Internet is
            100% secure. We cannot guarantee absolute security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
          <p className="text-zinc-400 leading-relaxed">You have the right to:</p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Unsubscribe from our newsletter at any time</li>
            <li>Opt out of cookies through your browser settings</li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-2">
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:info.zoltai@gmail.com"
              className="text-accent-light hover:underline"
            >
              info.zoltai@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            9. Children&apos;s Privacy
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Our site is not directed to children under 13. We do not knowingly
            collect personal information from children. If you believe we have
            collected such information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            10. Changes to This Policy
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date. Your continued
            use of the site after changes constitutes acceptance of the updated
            policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p className="text-zinc-400 leading-relaxed">
            If you have questions about this Privacy Policy, contact us at:
          </p>
          <p className="text-zinc-400 mt-2">
            <strong className="text-zinc-300">Email:</strong>{" "}
            <a
              href="mailto:info.zoltai@gmail.com"
              className="text-accent-light hover:underline"
            >
              info.zoltai@gmail.com
            </a>
            <br />
            <strong className="text-zinc-300">Website:</strong>{" "}
            <a
              href="https://zoltai.org"
              className="text-accent-light hover:underline"
            >
              zoltai.org
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
