import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Zoltai terms of service — rules and guidelines for using our website.",
};

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ label: "Terms of Service" }]} />
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-10">
        Last updated: April 7, 2026
      </p>

      <div className="prose prose-invert prose-sm max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
          <p className="text-zinc-400 leading-relaxed">
            By accessing or using zoltai.org (&quot;the Site&quot;), you agree
            to be bound by these Terms of Service. If you do not agree, please
            do not use the Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. Description of Service
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Zoltai is an educational website that provides reviews, guides, and
            information about AI tools and technology. Our content is designed to
            help users discover, compare, and learn about AI tools for
            productivity and professional development.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            3. Educational Content Disclaimer
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            All content on Zoltai is provided for{" "}
            <strong className="text-zinc-300">
              educational and informational purposes only
            </strong>
            . We do not guarantee any specific results, outcomes, or benefits
            from using the tools or strategies discussed on our site.
          </p>
          <p className="text-zinc-400 leading-relaxed mt-2">
            Individual results vary based on many factors including but not
            limited to: personal effort, skill level, market conditions, and
            experience. Nothing on this website should be interpreted as a
            promise or guarantee of specific outcomes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            4. No Financial or Professional Advice
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            The content on Zoltai does not constitute financial, business, legal,
            or professional advice. We are not licensed financial advisors,
            business consultants, or legal professionals. Always consult with
            qualified professionals before making business or financial
            decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            5. Affiliate Links and Sponsorships
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Our site contains affiliate links to third-party products and
            services. This means:
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 mt-2">
            <li>
              We may receive a commission if you purchase through our links
            </li>
            <li>There is no additional cost to you</li>
            <li>
              We only recommend tools we have personally reviewed and believe
              provide genuine value
            </li>
            <li>
              Affiliate relationships do not influence our editorial content or
              ratings
            </li>
          </ul>
          <p className="text-zinc-400 leading-relaxed mt-2">
            We strive for transparency in all our recommendations. Affiliate
            links are clearly disclosed where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            6. User Accounts
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            When you create an account, you are responsible for maintaining the
            security of your credentials and for all activities under your
            account. You must provide accurate information and keep it up to
            date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            7. User-Generated Content
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            By posting comments or other content on our site, you grant us a
            non-exclusive license to use, display, and distribute that content.
            You are responsible for ensuring your content does not violate any
            laws or third-party rights. We reserve the right to remove any
            content at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            8. Intellectual Property
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            All content on Zoltai — including text, graphics, logos, and
            software — is our property or the property of our content providers
            and is protected by copyright and intellectual property laws. You may
            not reproduce, distribute, or create derivative works without our
            written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            9. Third-Party Links
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Our site contains links to third-party websites and services. We are
            not responsible for the content, privacy practices, or terms of
            these external sites. Visiting third-party links is at your own
            risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            10. Newsletter and Communications
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            By subscribing to our newsletter, you consent to receive periodic
            emails about AI tools, guides, and related content. You can
            unsubscribe at any time using the link in our emails. We will never
            share your email address with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            11. Limitation of Liability
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            To the fullest extent permitted by law, Zoltai shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the site or any tools recommended
            on the site. Our total liability shall not exceed the amount you
            paid us (if any) in the 12 months prior to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            12. Changes to Terms
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            We may update these Terms of Service at any time. Changes will be
            posted on this page with an updated date. Continued use of the Site
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
          <p className="text-zinc-400 leading-relaxed">
            For questions about these Terms, contact us at:
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
