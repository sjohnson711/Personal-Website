import { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";
import ContactModal from "../components/ContactModal";

const background = [
  { label: "Education", details: ["M.A. Clinical Mental Health Counseling, Webster University", "Full-Stack Software Engineering, Code The Dream"] },
  { label: "Community & mentorship", details: ["Code The Dream tech mentor", "CodePath Tech Fellow"] },
  { label: "Training & honors", details: ["Honors in AI-Applied Engineering, CodePath", "Technical Interviewing, CodePath"] },
  { label: "Speaking", details: ["Beyond the Armor Podcast"] },
];

export default function AboutPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="about-page fade-up">
      <header className="about-header">
        <p className="about-eyebrow">About the author</p>
        <h1>Seth Johnson</h1>
      </header>

      <section className="about-profile" aria-labelledby="about-role">
        <figure className="about-portrait">
          <img src="/Proifleofficepic.png" alt="Portrait of Seth Johnson" width={500} height={500} />
        </figure>

        <div className="about-bio">
          <h2 id="about-role">Software Engineer &amp;<br /> Mental Health Therapist</h2>
          <p className="about-lead">
            Born and raised in Georgia, Seth Johnson has spent over a decade in human services, with a passion for educating children from underserved communities.
          </p>
          <p>
            His work includes serving as a former Residential Program Director at Landmark for Families in Charleston, South Carolina. With a master's in Clinical Mental Health Counseling and a decade of community work, his transition to technology was an expansion of that mission.
          </p>
          <p>
            A Code The Dream full-stack graduate with CodePath training in AI Applied Engineering and Technical Interviewing, Seth brings a AI-Forward expertise to his commitment to equity. Today, he works as a Security Software Engineer with the intentions of creating a safe place for users to keep their data safe. He continues to encourage others that if you have faith in the Lord you can accomplish anything. 

          </p>
          <div className="about-connect" aria-label="Connect with Seth">
            <a href="https://www.linkedin.com/in/seth-johnson-10a6a217b/" target="_blank" rel="noopener noreferrer" className="about-connect-link">
              LinkedIn <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <button type="button" onClick={() => setShowContact(true)} className="about-connect-link">
              <Mail size={18} aria-hidden="true" /> Email
            </button>
          </div>
        </div>
      </section>

      <section className="about-background" aria-labelledby="about-background-heading">
        <h2 id="about-background-heading">Background &amp; contributions</h2>
        <dl className="about-details">
          {background.map(({ label, details }) => (
            <div key={label} className="about-detail">
              <dt>{label}</dt>
              <dd>{details.map(detail => <p key={detail}>{detail}</p>)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
    </div>
  );
}
