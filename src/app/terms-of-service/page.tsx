import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Definition Detective',
  description: 'Terms of service for Definition Detective app',
  robots: 'index, follow',
};

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
        color: 'white',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>📋 Terms of Service</h1>
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
          ✅ 1. Acceptance of Terms
        </h2>
        <p>By downloading, installing, or using Definition Detective ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the App.</p>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          🎁 2. License Grant
        </h2>
        <p>We grant you a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes on a compatible device that you own or control.</p>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>2.1 Permitted Uses</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Play the game and enjoy features</li>
          <li style={{ marginBottom: '8px' }}>Create a user account</li>
          <li style={{ marginBottom: '8px' }}>Participate in leaderboards (with a username)</li>
          <li style={{ marginBottom: '8px' }}>Access hints and AI-generated suggestions</li>
          <li style={{ marginBottom: '8px' }}>Make in-app purchases</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>2.2 Prohibited Uses</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Modify, reverse-engineer, or decompile the App</li>
          <li style={{ marginBottom: '8px' }}>Use the App for commercial purposes</li>
          <li style={{ marginBottom: '8px' }}>Rent, lease, or lend the App</li>
          <li style={{ marginBottom: '8px' }}>Access the App via automated means (bots, scrapers)</li>
          <li style={{ marginBottom: '8px' }}>Cheat, hack, or exploit game mechanics</li>
          <li style={{ marginBottom: '8px' }}>Harass, abuse, or threaten other players</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          👤 3. User Account & Registration
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>3.1 Account Requirements</h3>
        <p>To use certain features, you must create an account by providing:</p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>A valid email address</li>
          <li style={{ marginBottom: '8px' }}>A username</li>
          <li style={{ marginBottom: '8px' }}>A password</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          💳 4. In-App Purchases & Payments
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.1 Premium Features</h3>
        <p>Definition Detective offers optional in-app purchases for premium features, including:</p>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Ad-free gameplay</li>
          <li style={{ marginBottom: '8px' }}>Unlimited hints</li>
          <li style={{ marginBottom: '8px' }}>Exclusive themes</li>
          <li style={{ marginBottom: '8px' }}>Special in-game currency</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>4.5 Refunds Policy</h3>
        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderLeft: '4px solid #ff9800',
          margin: '20px 0',
          borderRadius: '4px',
          color: '#856404'
        }}>
          <strong>Refund Eligibility:</strong><br />
          All purchases are generally final and non-refundable. We may provide refunds in cases of:
        </div>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Technical errors or service interruptions</li>
          <li style={{ marginBottom: '8px' }}>Duplicate charges</li>
          <li style={{ marginBottom: '8px' }}>Accidental purchases (within 24 hours)</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          🚫 6. Prohibited Conduct
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>6.1 Cheating & Exploitation</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Use cheats, hacks, or exploits</li>
          <li style={{ marginBottom: '8px' }}>Modify game files or data</li>
          <li style={{ marginBottom: '8px' }}>Manipulate scores or rankings</li>
          <li style={{ marginBottom: '8px' }}>Exploit bugs or glitches intentionally</li>
        </ul>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>6.2 Disruptive Behavior</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Harass, threaten, or abuse other players</li>
          <li style={{ marginBottom: '8px' }}>Send spam or unwanted messages</li>
          <li style={{ marginBottom: '8px' }}>Post hateful, discriminatory, or abusive content</li>
          <li style={{ marginBottom: '8px' }}>Engage in trolling or disruptive behavior</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          🏆 7. Leaderboard & Fair Play
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>7.1 Leaderboard Rules</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>Scores are verified by our anti-cheat systems</li>
          <li style={{ marginBottom: '8px' }}>Fraudulent scores may be removed without notice</li>
          <li style={{ marginBottom: '8px' }}>Accounts with evidence of cheating may be suspended or banned</li>
          <li style={{ marginBottom: '8px' }}>Leaderboard position is determined by authenticated scores only</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          ⚖️ 8. Limitation of Liability
        </h2>

        <div style={{
          background: '#ffebee',
          borderLeft: '4px solid #d32f2f',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          <strong>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND UNINTERRUPTED SERVICE.</strong>
        </div>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          👶 11. Age Restrictions
        </h2>

        <h3 style={{ color: '#512DA8', marginTop: '20px', marginBottom: '10px', fontSize: '1.1em' }}>11.1 Age Requirements</h3>
        <ul style={{ marginLeft: '30px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '8px' }}>You must be at least 13 years old to use the App</li>
          <li style={{ marginBottom: '8px' }}>You must be 18+ to make in-app purchases (or have parental consent)</li>
          <li style={{ marginBottom: '8px' }}>Users under 13 may not create accounts</li>
        </ul>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          📞 12. Contact Information
        </h2>

        <p>For questions about these Terms:</p>
        <div style={{
          background: '#e8eaf6',
          padding: '20px',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <strong style={{ color: '#673AB7', display: 'block' }}>Definition Detective</strong>
          📧 Email: support@traylapps.com<br />
          🌐 Website: <a href="https://traylapps.com" target="_blank" rel="noopener noreferrer" style={{ color: '#673AB7', textDecoration: 'none', borderBottom: '1px solid #673AB7' }}>https://traylapps.com</a><br />
          📱 In-App: Settings > Help & Support
        </div>

        <h2 style={{ color: '#673AB7', marginTop: '30px', marginBottom: '15px', fontSize: '1.5em', borderBottom: '2px solid #673AB7', paddingBottom: '10px' }}>
          🙏 14. Acknowledgment
        </h2>

        <div style={{
          background: '#f3e5f5',
          padding: '20px',
          borderLeft: '4px solid #673AB7',
          margin: '20px 0',
          borderRadius: '4px'
        }}>
          <strong>BY USING DEFINITION DETECTIVE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.</strong>
          <p style={{ marginTop: '15px' }}>If you do not agree, you must not use the App.</p>
        </div>

        <div style={{
          color: '#888',
          fontSize: '0.95em',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <p><strong>Definition Detective</strong></p>
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
        <p><strong>Thank you for playing Definition Detective!</strong></p>
        <p>📧 Questions? Contact: support@traylapps.com</p>
      </div>
    </div>
  );
}
