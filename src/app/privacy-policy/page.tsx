import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Definition Detective',
  description: 'Privacy policy for Definition Detective app',
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
        color: 'white',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>🔒 Privacy Policy</h1>
        <p style={{ fontSize: '1.1em' }}>Definition Detective</p>
        <p style={{ fontSize: '0.9em', marginTop: '10px', opacity: 0.95 }}>Last Updated: May 31, 2026</p>
      </div>

      <div style={{
        background: 'white',
        padding: '40px',
        lineHeight: '1.6',
        color: '#333'
      }}>
        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          📋 Introduction
        </h2>
        <p>Welcome to Definition Detective ("App," "we," "us," or "our"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.</p>
        <p>Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our App.</p>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          📊 Information We Collect
        </h2>
        
        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>2.1 Information You Provide Directly</h3>
        
        <p><strong>Account Registration:</strong></p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Email address</li>
          <li style={{ marginBottom: '8px' }}>Username</li>
          <li style={{ marginBottom: '8px' }}>Password (encrypted)</li>
          <li style={{ marginBottom: '8px' }}>Profile information (optional: display name, avatar)</li>
        </ul>

        <p><strong>Payment Information:</strong></p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Payment method details (processed securely through Paystack)</li>
          <li style={{ marginBottom: '8px' }}>Transaction history</li>
          <li style={{ marginBottom: '8px' }}>Purchase records</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>2.2 Information Collected Automatically</h3>
        
        <p><strong>Device Information:</strong></p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Device type, operating system, and version</li>
          <li style={{ marginBottom: '8px' }}>Device model and unique device identifiers</li>
          <li style={{ marginBottom: '8px' }}>Mobile network information</li>
          <li style={{ marginBottom: '8px' }}>Device storage capacity</li>
        </ul>

        <p><strong>Usage Data:</strong></p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Game progress and statistics (levels completed, scores, achievements)</li>
          <li style={{ marginBottom: '8px' }}>Features you interact with</li>
          <li style={{ marginBottom: '8px' }}>Session duration and timestamps</li>
          <li style={{ marginBottom: '8px' }}>Gameplay analytics</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          ⚙️ How We Use Your Information
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>3.1 Service Provision</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Creating and maintaining your account</li>
          <li style={{ marginBottom: '8px' }}>Processing payments and transactions</li>
          <li style={{ marginBottom: '8px' }}>Delivering game features and content</li>
          <li style={{ marginBottom: '8px' }}>Generating AI-powered hints and suggestions</li>
          <li style={{ marginBottom: '8px' }}>Maintaining leaderboards and player statistics</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          🔗 Third-Party Services
        </h2>

        <p>We use the following third-party services that may collect and process your data:</p>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.1 Firebase (Google Cloud Platform)</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Services:</strong> Authentication, Firestore database, analytics</li>
          <li style={{ marginBottom: '8px' }}><strong>Data:</strong> User accounts, game data, usage patterns</li>
          <li style={{ marginBottom: '8px' }}><strong>Privacy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>Google Privacy Policy</a></li>
          <li style={{ marginBottom: '8px' }}><strong>Security:</strong> Industry-standard encryption</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.2 Paystack</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Services:</strong> Payment processing</li>
          <li style={{ marginBottom: '8px' }}><strong>Data:</strong> Payment methods, transaction records</li>
          <li style={{ marginBottom: '8px' }}><strong>Privacy:</strong> <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>Paystack Privacy Policy</a></li>
          <li style={{ marginBottom: '8px' }}><strong>Security:</strong> PCI DSS compliant, encrypted payment data</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.3 Google Generative AI</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Services:</strong> AI-powered hint generation</li>
          <li style={{ marginBottom: '8px' }}><strong>Data:</strong> Game context (only the current puzzle state, not account info)</li>
          <li style={{ marginBottom: '8px' }}><strong>Privacy:</strong> <a href="https://ai.google.dev/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>Google AI Privacy</a></li>
          <li style={{ marginBottom: '8px' }}><strong>Note:</strong> Queries are NOT stored in our database</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.4 Google AdSense</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Services:</strong> Ad serving and personalization</li>
          <li style={{ marginBottom: '8px' }}><strong>Data:</strong> Browsing patterns, interests (via Google ad cookies)</li>
          <li style={{ marginBottom: '8px' }}><strong>Privacy:</strong> <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>Google Ads Privacy & Terms</a></li>
          <li style={{ marginBottom: '8px' }}><strong>Opt-out:</strong> <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>Ad Personalization Settings</a></li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          💾 Data Storage & Retention
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>5.1 Where We Store Data</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Primary:</strong> Google Cloud Firestore (Firebase)</li>
          <li style={{ marginBottom: '8px' }}><strong>Backups:</strong> Google Cloud automated backups</li>
          <li style={{ marginBottom: '8px' }}><strong>Location:</strong> Data primarily stored in US regions with geographical redundancy</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>5.2 Retention Periods</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Account Data:</strong> Retained while your account is active. Deleted within 30 days of account deletion.</li>
          <li style={{ marginBottom: '8px' }}><strong>Game Progress:</strong> Retained for your account lifespan</li>
          <li style={{ marginBottom: '8px' }}><strong>Payment Records:</strong> Retained for 7 years (for tax and accounting compliance)</li>
          <li style={{ marginBottom: '8px' }}><strong>Logs & Analytics:</strong> Retained for 90 days, then aggregated</li>
          <li style={{ marginBottom: '8px' }}><strong>Crash Data:</strong> Retained for 30 days for debugging purposes</li>
          <li style={{ marginBottom: '8px' }}><strong>Marketing Data:</strong> Retained until you opt-out</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          ✋ Your Privacy Rights
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>8.1 EU/GDPR Rights</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Access:</strong> Request a copy of your personal data</li>
          <li style={{ marginBottom: '8px' }}><strong>Correction:</strong> Correct inaccurate data</li>
          <li style={{ marginBottom: '8px' }}><strong>Deletion:</strong> Request deletion ("Right to be Forgotten")</li>
          <li style={{ marginBottom: '8px' }}><strong>Portability:</strong> Receive your data in portable format</li>
          <li style={{ marginBottom: '8px' }}><strong>Restriction:</strong> Restrict processing of your data</li>
          <li style={{ marginBottom: '8px' }}><strong>Objection:</strong> Object to certain processing activities</li>
          <li style={{ marginBottom: '8px' }}><strong>Withdraw Consent:</strong> Withdraw consent to data processing</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>8.3 How to Exercise Your Rights</h3>
        <div style={{
          background: '#e8eaf6',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>Email:</strong> support@traylapps.com<br />
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>Subject:</strong> "Privacy Rights Request"<br />
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>Include:</strong> Your account email and specific request<br />
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>Response Time:</strong> We will respond within 30 days or provide timeline for complex requests
        </div>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          📞 Contact Information
        </h2>

        <p>For questions about this Privacy Policy or our privacy practices:</p>
        <div style={{
          background: '#e8eaf6',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <strong style={{ color: '#673AB7', display: 'block' }}>📧 Email:</strong> support@traylapps.com<br />
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>🌐 Website:</strong> <a href="https://traylapps.com" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>https://traylapps.com</a><br />
          <strong style={{ color: '#673AB7', display: 'block', marginTop: '10px' }}>📱 In-App Support:</strong> Settings > Help & Support
        </div>

        <div style={{
          color: '#888',
          fontSize: '0.95em',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <p><strong>Definition Detective</strong></p>
          <p>Privacy Team</p>
          <p>📧 support@traylapps.com</p>
          <p>🌐 <a href="https://traylapps.com" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>https://traylapps.com</a></p>
          <p style={{
            marginTop: '15px',
            borderTop: '1px solid #ddd',
            paddingTop: '15px'
          }}>
            <strong>Last Updated:</strong> May 31, 2026<br />
            <strong>Version:</strong> 1.0<br />
            <strong>Effective Date:</strong> June 1, 2026
          </p>
        </div>
      </div>

      <div style={{
        background: '#f5f5f5',
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9em',
        borderTop: '1px solid #ddd'
      }}>
        <p><strong>Thank you for trusting Definition Detective with your privacy.</strong></p>
        <p>📧 Questions? Contact: support@traylapps.com</p>
      </div>
    </div>
  );
}
