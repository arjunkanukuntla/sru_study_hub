import React from 'react'

export default function TermsPage() {
  return (
    <div className="page-wrapper" style={{ maxWidth: 780, marginInline: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Terms of Use & Legal Disclaimers</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Last updated: September 2026 &nbsp;·&nbsp; SRU Study Hub (Independent Student Platform)
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', lineHeight: 1.8 }}>

        {/* Highlighted Disclaimer Banner */}
        <div style={{
          background: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: 'var(--color-primary-900)',
        }}>
          <strong>Important Legal Notice:</strong> SRU Study Hub is an <em>independent, non-official student-run utility</em>. It is NOT operated by, affiliated with, authorized by, or endorsed by SR University. All university names, course codes, and trademarks belong exclusively to their respective owners.
        </div>

        <Section title="1. Non-Official & Independent Status">
          <p>
            SRU Study Hub ("Study Hub", "we", "us") is an open, non-commercial student initiative created solely by students for students of SR University.
            This platform does not represent the official administration, faculty, or examination branch of SR University in any capacity.
          </p>
        </Section>

        <Section title="2. Educational Fair Use Purpose">
          <p>
            All academic materials hosted on or accessible through Study Hub—including past examination papers, syllabi, lecture notes, lab manuals, and sample question banks—are shared strictly for <strong>Educational Fair Use</strong>, self-study, exam preparation, and non-commercial academic reference.
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>No commercial profit, sales, or fee-based services are derived from these materials.</li>
            <li>Content is contributed voluntarily by student peers to assist in educational learning.</li>
          </ul>
        </Section>

        <Section title="3. Copyright & Intellectual Property Protection">
          <p>
            We respect the intellectual property rights of all creators and institutions. No copyright infringement is intended.
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Official examination question papers and syllabus documents remain the intellectual property of SR University.</li>
            <li>Student-created lecture notes and study guides remain the property of their respective authoring students.</li>
            <li>Study Hub does not claim ownership over any uploaded academic materials.</li>
          </ul>
        </Section>

        <Section title="4. Copyright Takedown Procedure (Notice & Takedown)">
          <p>
            If you are a copyright owner, authorized university representative, or faculty member and believe that any content hosted on Study Hub infringes upon your copyright or intellectual property rights:
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Please notify us immediately by submitting a report via the built-in <strong>"Report incorrect / copyright item"</strong> button on the item's page or by contacting our administration.
            Upon receiving a verified request, we will <strong>promptly remove or disable access to the specified material within 24–48 hours</strong> without conflict, copyright strikes, or delay.
          </p>
        </Section>

        <Section title="5. Content Standards & User Conduct">
          <p>Users contributing materials agree that uploaded files must:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Be genuine academic study materials relevant to university coursework</li>
            <li>Not contain confidential, personal, offensive, or inappropriate non-academic content</li>
            <li>Not be used for commercial gain or unauthorized distribution</li>
          </ul>
        </Section>

        <Section title="6. Disclaimer of Warranties & Limitation of Liability">
          <p>
            Study Hub is provided on an "as-is" and "as-available" basis for informational study purposes only.
            We make no guarantees regarding the completeness, accuracy, or current validity of past examination papers or user notes.
            Students are advised to always cross-check course materials with their official university faculty and portal.
          </p>
        </Section>

        <Section title="7. Contact & Removal Requests">
          <p>
            For any copyright removal notices, policy inquiries, or content feedback, please use the on-site Report function or contact the student administration panel.
          </p>
        </Section>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <a href="/privacy" style={{ color: 'var(--color-primary-600)', fontSize: '0.875rem', fontWeight: 600 }}>
          View Privacy Policy →
        </a>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {children}
      </div>
    </div>
  )
}
