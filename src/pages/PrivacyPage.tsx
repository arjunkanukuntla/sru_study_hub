export default function PrivacyPage() {
  return (
    <div className="page-wrapper" style={{ maxWidth: 720, marginInline: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Last updated: September 2026 &nbsp;·&nbsp; SR University Study Hub
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', lineHeight: 1.8 }}>
        <Section title="1. Overview">
          SR University Study Hub is designed with student privacy in mind. We do not require
          you to create an account, log in, or provide any personal information to use this
          platform. This policy explains what minimal information is collected and how it is used.
        </Section>

        <Section title="2. No Account Required">
          You can browse, search, and download all materials on Study Hub without signing up
          or identifying yourself in any way. Uploading materials also requires no account —
          contributors are identified only by an anonymous, randomly generated ID that is
          stored in your browser and is not linked to any personal information.
        </Section>

        <Section title="3. Information We Collect">
          <p>We collect only the following minimal information:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>
              <strong>Anonymous contributor ID</strong> — A randomly generated identifier
              stored locally in your browser. Used only to attribute uploads on the platform.
              It is not linked to your name, email, or any personal data.
            </li>
            <li>
              <strong>Uploaded content</strong> — Files and metadata (subject, branch, exam
              type) that you choose to upload. These are stored securely in the cloud and
              made available to all students.
            </li>
            <li>
              <strong>Usage analytics</strong> — Anonymous, aggregated data about which pages
              are visited. No personally identifiable information is collected. This helps us
              improve the platform.
            </li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Information">
          <p>The information collected is used solely to:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Display uploaded materials to all SR University students</li>
            <li>Give contributors credit for their uploads via their anonymous ID</li>
            <li>Improve platform performance and user experience</li>
            <li>Detect and prevent duplicate uploads</li>
          </ul>
        </Section>

        <Section title="5. Data Storage">
          Uploaded files and metadata are stored securely using industry-standard cloud
          infrastructure. Files are accessible to all users of the platform. We do not sell,
          rent, or share your data with any third parties for marketing purposes.
        </Section>

        <Section title="6. Cookies & Local Storage">
          Study Hub uses your browser's local storage to remember your anonymous contributor
          ID and preferences (such as dark mode). No tracking cookies are used. You can
          clear this data at any time through your browser settings.
        </Section>

        <Section title="7. Your Rights">
          <p>Since we do not collect personal information, there is no personal data to delete
          or access. However, you may:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Clear your browser's local storage to remove your anonymous ID</li>
            <li>Request removal of any content you uploaded by contacting us</li>
          </ul>
        </Section>

        <Section title="8. Children's Privacy">
          Study Hub is intended for use by university students (typically 18 years and above).
          We do not knowingly collect any information from minors.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy occasionally. We encourage you to review this
          page periodically. Your continued use of Study Hub after changes are posted means
          you accept the updated policy.
        </Section>

        <Section title="10. Contact">
          If you have any questions or concerns about your privacy on Study Hub, please reach
          out through SR University's student community channels.
        </Section>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/terms" style={{ color: 'var(--color-primary-600)', fontSize: '0.875rem' }}>
          View our Terms of Use →
        </a>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {children}
      </div>
    </div>
  )
}
