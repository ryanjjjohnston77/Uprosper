import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, ScrollText, AlertCircle } from "lucide-react";

const LAST_UPDATED = "April 2026";

interface TermsAcceptanceCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  testIdPrefix?: string;
}

export function TermsAcceptanceCheckbox({
  checked,
  onCheckedChange,
  error,
  testIdPrefix = "signup",
}: TermsAcceptanceCheckboxProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="space-y-1">
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
          data-testid={`checkbox-${testIdPrefix}-terms`}
        />
        <span className="text-xs text-gray-700 leading-relaxed">
          I agree to the{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
            className="font-medium underline hover:no-underline"
            style={{ color: "#1a7a5c" }}
            data-testid={`link-${testIdPrefix}-privacy`}
          >
            Privacy Policy
          </button>{" "}
          and{" "}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
            className="font-medium underline hover:no-underline"
            style={{ color: "#1a7a5c" }}
            data-testid={`link-${testIdPrefix}-terms`}
          >
            Terms &amp; Conditions
          </button>
          .
        </span>
      </label>
      {error && (
        <p className="text-xs text-red-600 pl-6" data-testid={`error-${testIdPrefix}-terms`}>
          {error}
        </p>
      )}
      <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
      <TermsConditionsDialog open={showTerms} onOpenChange={setShowTerms} />
    </div>
  );
}

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: LegalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-0 [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100 [&>button]:bg-transparent [&>button]:ring-0 [&>button]:ring-offset-0 [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:border-0 [&>button]:shadow-none"
        data-testid="dialog-privacy-policy"
      >
        <div
          className="flex items-center gap-3 px-6 py-5 text-white"
          style={{ background: "linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)" }}
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-heading font-bold">Privacy Policy</h2>
            <p className="text-xs text-white/80">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        <div
          className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-80px)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <p>
                Uprosper ("we", "our", "us") is committed to protecting your privacy. This policy
                explains what information we collect, how we use it, and the choices you have. We
                act as a data controller for the information you provide directly to us through
                the Uprosper platform.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Information we collect</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account details</strong> — name, email address, phone number, and the broker code you used to register.</li>
                <li><strong>Profile information</strong> — basic data you choose to share to support your homeownership journey, such as approximate property value, mortgage milestones, and preferences.</li>
                <li><strong>Usage data</strong> — pages visited, features used, device and browser information, and approximate location derived from your IP address.</li>
                <li><strong>Communications</strong> — messages you send to us or your broker through the platform, and notifications you receive.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">How we use your information</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To operate the Uprosper platform and connect you with your chosen broker.</li>
                <li>To send you service updates, journey reminders, and reward notifications you have opted into.</li>
                <li>To improve our product through aggregate, anonymised analytics.</li>
                <li>To meet legal, regulatory, and fraud-prevention obligations.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Lawful basis (UK GDPR)</h3>
              <p>
                We process your personal data on the basis of your consent (where you have given
                it), the performance of our contract with you, our legitimate interests in running
                and improving the platform, and where necessary to comply with legal obligations.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Sharing your information</h3>
              <p>
                We only share your information with the broker you have chosen to connect with,
                with carefully selected service providers who help us run the platform (for
                example hosting, email, and analytics), and with regulators or law-enforcement
                bodies where we are legally required to do so. We do not sell your personal data.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Retention</h3>
              <p>
                We keep your information only as long as needed to provide the service and meet
                our legal obligations. When you close your account, we delete or anonymise your
                personal data within a reasonable period, except where we are required to retain
                it by law.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Your rights</h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Access the personal data we hold about you.</li>
                <li>Ask us to correct inaccurate information.</li>
                <li>Request deletion of your data, subject to legal exceptions.</li>
                <li>Object to or restrict certain processing.</li>
                <li>Withdraw consent at any time, where processing is based on consent.</li>
                <li>Lodge a complaint with the UK Information Commissioner's Office (ICO).</li>
              </ul>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Cookies</h3>
              <p>
                We use a small number of essential cookies to keep you signed in and to remember
                your preferences. We use privacy-friendly analytics to understand how the platform
                is used, in an aggregated, non-identifying way.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Contact us</h3>
              <p>
                For any privacy questions or to exercise your rights, please contact us at{" "}
                <span className="font-semibold text-gray-900">privacy@uprosper.co.uk</span>.
              </p>
            </section>

            <section
              className="rounded-xl p-3 text-xs text-gray-600"
              style={{ background: "rgba(68,186,132,0.05)", border: "1px solid rgba(68,186,132,0.15)" }}
            >
              This policy is provided as a plain-English summary. Uprosper introduces clients to
              regulated mortgage and protection brokers; we are not ourselves a regulated financial
              adviser.
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TermsConditionsDialog({ open, onOpenChange }: LegalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-0 [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100 [&>button]:bg-transparent [&>button]:ring-0 [&>button]:ring-offset-0 [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:border-0 [&>button]:shadow-none"
        data-testid="dialog-terms-conditions"
      >
        <div
          className="flex items-center gap-3 px-6 py-5 text-white"
          style={{ background: "linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)" }}
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <ScrollText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-heading font-bold">Terms &amp; Conditions</h2>
            <p className="text-xs text-white/80">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        <div
          className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-80px)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <p>
                These terms govern your use of the Uprosper platform. By creating an account or
                otherwise using the service you agree to these terms. If you do not agree, please
                do not use the platform.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">About Uprosper</h3>
              <p>
                Uprosper is a technology platform that helps homeowners track their financial
                journey and stay connected with their chosen mortgage broker. We introduce
                clients to independently regulated brokers and product providers; we do not
                ourselves provide regulated mortgage, insurance, or investment advice.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Eligibility</h3>
              <p>
                You must be at least 18 years old and a UK resident to register. You agree to
                provide accurate information and to keep your account credentials confidential.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Acceptable use</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Use the platform only for lawful, personal purposes.</li>
                <li>Do not attempt to interfere with, reverse-engineer, or disrupt the service.</li>
                <li>Do not upload content that is unlawful, abusive, or infringing.</li>
                <li>Do not impersonate another person or share your account.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Broker introductions &amp; advice</h3>
              <p>
                Uprosper makes introductions to FCA-authorised mortgage and protection brokers and
                to other product partners. Any advice you receive comes from those independently
                regulated firms, not from Uprosper. Decisions you make based on that advice are
                between you and the regulated firm. We do not guarantee any specific product,
                rate, or outcome.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Rewards &amp; partner offers</h3>
              <p>
                Rewards, cashback, and partner offers shown in the platform are subject to the
                terms of the relevant partner. Availability and amounts may change without notice.
                Some offers depend on your broker or product partner completing eligibility
                checks.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Intellectual property</h3>
              <p>
                The Uprosper name, logo, designs, and software are owned by us or our licensors.
                You receive a limited, personal, non-transferable licence to use the platform for
                its intended purpose.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Limitation of liability</h3>
              <p>
                To the fullest extent permitted by law, Uprosper is not liable for any indirect,
                incidental, or consequential losses arising from your use of the platform. Nothing
                in these terms limits our liability for fraud, death or personal injury caused by
                negligence, or any other liability that cannot be excluded under English law.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Suspension &amp; termination</h3>
              <p>
                We may suspend or close accounts that breach these terms, that we reasonably
                believe are being used fraudulently, or where we are required to do so by law. You
                may close your account at any time from your profile settings.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Changes to these terms</h3>
              <p>
                We may update these terms from time to time. If a change is material we will give
                you reasonable notice through the platform or by email. Continued use after the
                change takes effect means you accept the updated terms.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Governing law</h3>
              <p>
                These terms are governed by the laws of England and Wales, and the courts of
                England and Wales have exclusive jurisdiction over any dispute, except that you
                may also bring a claim in your local UK jurisdiction where you are entitled to do
                so.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Contact us</h3>
              <p>
                Questions about these terms? Reach us at{" "}
                <span className="font-semibold text-gray-900">support@uprosper.co.uk</span>.
              </p>
            </section>

            <section
              className="rounded-xl p-3 text-xs text-gray-600"
              style={{ background: "rgba(68,186,132,0.05)", border: "1px solid rgba(68,186,132,0.15)" }}
            >
              Uprosper is an introducer, not a regulated financial adviser. Your home may be
              repossessed if you do not keep up repayments on a mortgage secured against it.
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DisclaimerDialog({ open, onOpenChange }: LegalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-0 [&>button]:text-white [&>button]:opacity-90 [&>button:hover]:opacity-100 [&>button]:bg-transparent [&>button]:ring-0 [&>button]:ring-offset-0 [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:border-0 [&>button]:shadow-none"
        data-testid="dialog-disclaimer"
      >
        <div
          className="flex items-center gap-3 px-6 py-5 text-white"
          style={{ background: "linear-gradient(135deg, #44ba84 0%, #38a373 50%, #2d8b63 100%)" }}
        >
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-heading font-bold">Disclaimer</h2>
            <p className="text-xs text-white/80">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        <div
          className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-80px)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(68,186,132,0.04) 50%, rgba(255,255,255,0.95) 100%)",
          }}
        >
          <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <p>
                Uprosper is a rewards and client engagement platform. We are not a regulated
                financial service and we do not provide regulated financial, mortgage, insurance,
                investment, tax, or legal advice. The platform exists to help you stay organised
                and connected with your chosen mortgage broker.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Broker introductions</h3>
              <p>
                Where Uprosper introduces you to a mortgage broker, protection adviser, or other
                product partner, those firms are independently authorised and regulated by the
                relevant UK regulators (such as the Financial Conduct Authority). Any advice you
                receive comes from those regulated firms, not from Uprosper.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Affiliate &amp; partner offers</h3>
              <p>
                Some partner offers featured on the platform include affiliate or referral links.
                This means Uprosper and/or your broker may receive a small commission, at no extra
                cost to you, when you take up an offer. This never changes the price you pay or
                the suitability of any product for your circumstances.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">No guarantees</h3>
              <p>
                Rewards, cashback, rates, and product availability are provided by third-party
                partners and are subject to their terms. They can change or be withdrawn without
                notice. Uprosper does not guarantee any specific product, rate, reward, or
                financial outcome.
              </p>
            </section>

            <section>
              <h3 className="font-heading font-bold text-gray-900 mb-2">Seek independent advice</h3>
              <p>
                All financial products and services shown on the platform are provided by
                third-party partners. We strongly recommend you seek independent professional
                advice before making any financial decision, particularly for mortgages,
                protection products, investments, or tax matters.
              </p>
            </section>

            <section
              className="rounded-xl p-3 text-xs text-gray-600"
              style={{ background: "rgba(68,186,132,0.05)", border: "1px solid rgba(68,186,132,0.15)" }}
            >
              Your home may be repossessed if you do not keep up repayments on a mortgage secured
              against it. Past performance is not a reliable indicator of future results.
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
