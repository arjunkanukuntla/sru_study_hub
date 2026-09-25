export default function TermsPage() {
  return (
    <div className="page-wrapper" style={{ maxWidth: 720, marginInline: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Terms of Use</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Last updated: September 2026 &nbsp;·&nbsp; SR University Study Hub
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', lineHeight: 1.8 }}>
        <Section title="1. Who We Are">
          SR University Study Hub ("Study Hub", "we", "us") is a student-built academic resource
          platform created to help SR University students share and access study materials, past
          question papers, lab manuals, and notes.
        </Section>

        <Section title="2. Acceptance of Terms">
          By accessing or using Study Hub, you agree to these Terms of Use. If you do not agree,
          please do not use the platform.
        </Section>

        <Section title="3. Permitted Use">
          <p>You may use Study Hub to:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Browse and download academic materials shared by fellow students</li>
            <li>Upload your own study materials for the benefit of the student community</li>
            <li>Use materials for personal, non-commercial academic study</li>
          </ul>
        </Section>

        <Section title="4. Content Standards">
          <p>All materials you upload must:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Be relevant to SR University courses and academic use</li>
            <li>Not contain any defamatory, offensive, or inappropriate content</li>
            <li>Not violate any third-party copyright or intellectual property rights</li>
            <li>Not include personal data of any individual without their consent</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            We reserve the right to remove any content that violates these standards without notice.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          Materials on this platform are shared by students for educational purposes. SR University
          Study Hub does not claim ownership over uploaded content. Uploaders retain any rights they
          hold over their own original materials. Question papers and official documents are the
          property of SR University.
        </Section>

        <Section title="6. No Warranties">
          Study Hub is provided "as is" for educational purposes. We make no guarantees about the
          accuracy, completeness, or reliability of any materials on the platform. Always verify
          information with your course instructor or official university resources.
        </Section>

        <Section title="7. Limitation of Liability">
          Study Hub and its creators are not liable for any academic outcomes, losses, or damages
          resulting from use of materials on this platform.
        </Section>

        <Section title="8. Changes to Terms">
          We may update these Terms from time to time. Continued use of Study Hub after changes
          are posted constitutes acceptance of the revised Terms.
        </Section>

        <Section title="9. Contact">
          If you have questions about these Terms or wish to report inappropriate content, please
          reach out through the SR University student community channels.
        </Section>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/privacy" style={{ color: 'var(--color-primary-600)', fontSize: '0.875rem' }}>
          View our Privacy Policy →
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
