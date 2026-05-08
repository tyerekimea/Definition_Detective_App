import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy | Definition Detective",
  description: "Privacy policy for Definition Detective app - learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Link>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-8">
        <p>Last Updated: May 8, 2026</p>
        <p>Effective Date: May 8, 2026</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Welcome to Definition Detective (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our application and website.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with our policies and practices,
            please do not use our services.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">1.1 Authentication Data (Firebase Authentication)</h4>
            <p>
              When you create an account or log in, we collect:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Email address</li>
              <li>Password (encrypted and managed by Firebase)</li>
              <li>Display name (optional)</li>
              <li>Profile picture (optional)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.2 Game Data (Firestore Database)</h4>
            <p>
              We store information about your gameplay and account preferences:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Game statistics (scores, streaks, completed rounds)</li>
              <li>Daily challenge progress</li>
              <li>Selected themes and preferences</li>
              <li>Hint usage and remaining hints</li>
              <li>Account creation and last login timestamps</li>
              <li>Subscription status and payment history references</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.3 Payment Information (Paystack)</h4>
            <p>
              When you make a purchase for premium features:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Payment method details are handled by Paystack (credit card, bank transfer, etc.)</li>
              <li>We store transaction IDs and subscription status</li>
              <li>We do NOT store your full credit card details - Paystack handles this securely</li>
              <li>Payment history is linked to your account for subscription management</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.4 Device and Usage Information</h4>
            <p>
              We automatically collect certain information about your device and how you use the app:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Device type and operating system</li>
              <li>App version and features accessed</li>
              <li>Session duration and timestamps</li>
              <li>General usage patterns (non-personally identifiable)</li>
              <li>Error logs for debugging purposes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">1.5 Communication Data</h4>
            <p>
              If you contact us for support, we collect:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Your email address</li>
              <li>Your message content and attachments</li>
              <li>Communication history for support purposes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">2.1 Primary Uses</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>To create and maintain your account</li>
              <li>To provide and personalize your gaming experience</li>
              <li>To track your progress and statistics</li>
              <li>To manage your subscription and premium features</li>
              <li>To process payments through Paystack</li>
              <li>To send you important account notifications and updates</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">2.2 Service Improvement</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>To analyze usage patterns and improve the app</li>
              <li>To fix bugs and technical issues</li>
              <li>To develop new features and themes</li>
              <li>To personalize content and recommendations</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">2.3 Communication</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>To respond to your inquiries and support requests</li>
              <li>To send transactional emails (purchase confirmations, subscription updates)</li>
              <li>To notify you of policy changes or important updates</li>
              <li>To send optional marketing communications (with your consent)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">2.4 Security and Legal Compliance</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
              <li>To enforce our Terms of Service</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Data Protection and Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">3.1 Security Measures</h4>
            <p>
              We implement industry-standard security practices to protect your data:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>All data is encrypted in transit using SSL/TLS protocols</li>
              <li>Firebase provides enterprise-grade security and authentication</li>
              <li>Firestore data is protected by Firebase security rules</li>
              <li>Payment data is encrypted and processed by PCI-compliant Paystack</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Regular security audits and monitoring</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">3.2 Data Retention</h4>
            <p>
              We retain your data as long as your account is active and for legitimate business purposes. You can
              request data deletion by contacting us (see Contact section below).
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">3.3 Third-Party Service Providers</h4>
            <p>
              Your data may be processed by trusted third-party providers:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li><strong>Firebase (Google Cloud)</strong> - Authentication, database, and hosting</li>
              <li><strong>Paystack</strong> - Payment processing and subscription management</li>
            </ul>
            <p className="mt-2">
              These providers have their own privacy policies and are contractually obligated to use your data only
              for the purposes specified.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Sharing Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We do <strong>NOT</strong> sell, rent, or share your personal information with third parties for
            marketing purposes.
          </p>

          <div>
            <h4 className="font-semibold text-foreground mb-2">4.1 When We May Share Data</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>With service providers who assist in operating our app (Firebase, Paystack)</li>
              <li>When required by law or legal process (court orders, government requests)</li>
              <li>To protect against fraud, security threats, or violations of our Terms of Service</li>
              <li>In the event of a merger, acquisition, or bankruptcy (with prior notice when possible)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">4.2 Aggregated Data</h4>
            <p>
              We may share anonymized, aggregated data that cannot identify you individually for research and
              analytics purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Your Data Rights and Choices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">5.1 Your Rights</h4>
            <p>
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">5.2 Account Controls</h4>
            <p>
              You can manage your account settings and preferences directly in the app:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Update your profile information</li>
              <li>Manage notification preferences</li>
              <li>Request account deletion</li>
              <li>Download your data</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">5.3 How to Exercise Your Rights</h4>
            <p>
              To exercise any of these rights, please contact us at definitiondetectivegame@gmail.com with a clear description of
              your request. We will respond within 30 days.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Firebase Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">6.1 What Firebase Collects</h4>
            <p>
              Firebase (by Google) assists in providing our services:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Authentication credentials (handled securely by Firebase)</li>
              <li>User profile data stored in Firestore</li>
              <li>Usage analytics (if analytics is enabled)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">6.2 Firebase Security Rules</h4>
            <p>
              Our Firestore database is protected by strict security rules that ensure:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Users can only access their own data</li>
              <li>Authentication is required for all operations</li>
              <li>Data validation is enforced</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">6.3 Google's Privacy Policy</h4>
            <p>
              Firebase is subject to Google&apos;s Privacy Policy. For more information about how Google handles data, please visit:
              {" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Paystack Payment Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">7.1 Payment Security</h4>
            <p>
              When you make a purchase, your payment information is processed through Paystack:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>We do NOT store your credit card details</li>
              <li>Paystack is PCI DSS Level 1 compliant</li>
              <li>All payment data is encrypted and secure</li>
              <li>Only transaction IDs and subscription status are stored on our servers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">7.2 What We Store</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Transaction ID and timestamp</li>
              <li>Subscription plan and duration</li>
              <li>Payment method type (not full details)</li>
              <li>Billing status</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">7.3 Paystack Privacy Policy</h4>
            <p>
              Paystack is subject to its own privacy policy. For details about payment data handling, visit:
              {" "}
              <a
                href="https://paystack.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Paystack Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We use cookies and similar tracking technologies to enhance your experience:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Session Cookies:</strong> To keep you logged in</li>
            <li><strong>Analytics Cookies:</strong> To understand how you use the app</li>
            <li><strong>Preference Cookies:</strong> To remember your settings</li>
          </ul>
          <p className="mt-3">
            You can control cookie settings through your browser or app preferences, but some cookies may be necessary for
            the app to function properly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Children&apos;s Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Definition Detective is intended for users 13 years and older. We do not knowingly collect personal
            information from children under 13. If we become aware that a child under 13 has provided us with personal
            information, we will delete such information and terminate the child&apos;s account.
          </p>
          <p>
            Parents or guardians who believe their child has provided information to us should contact us immediately
            at definitiondetectivegame@gmail.com.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Regional Privacy Laws</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-2">10.1 GDPR (European Users)</h4>
            <p>
              If you are in the EU, you have additional rights under GDPR:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Right to access, rectify, erase, and restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with your data protection authority</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">10.2 CCPA (California Users)</h4>
            <p>
              If you are in California, you have rights under CCPA:
            </p>
            <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale or sharing of data</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>11. Policy Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal
            requirements. We will notify you of any material changes by posting the updated policy and updating the
            &quot;Last Updated&quot; date.
          </p>
          <p>
            Your continued use of the app after changes constitute your acceptance of the revised Privacy Policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="space-y-2 mt-4">
            <p>
              <strong className="text-foreground">Email:</strong> definitiondetectivegame@gmail.com
            </p>
            <p>
              <strong className="text-foreground">Website:</strong> https://traylapps.com
            </p>
            <p>
              <strong className="text-foreground">Response Time:</strong> We aim to respond to privacy inquiries within 30 days
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            By using Definition Detective, you acknowledge that you have read and understood this Privacy Policy
            and agree to its terms. If you do not agree, please do not use our services.
          </p>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <Button variant="outline" asChild>
          <Link href="/">Return to Game</Link>
        </Button>
      </div>
    </div>
  );
}
