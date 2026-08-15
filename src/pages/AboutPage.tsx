import React from 'react';
import {
  ArrowRight,
  Building2,
  Database,
  ExternalLink,
  FileSearch,
  PhoneCall,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import type { Route } from '../types';

interface AboutPageProps {
  onNavigate: (route: Route) => void;
}

const steps = [
  {
    title: 'Find',
    description: 'Search official stabilized-building records by address, borough, ZIP code, or management name.',
    icon: Search,
  },
  {
    title: 'Understand',
    description: 'Review building, management, and condition information gathered around the record.',
    icon: FileSearch,
  },
  {
    title: 'Contact',
    description: 'Use public management information to ask about availability when contact details are present.',
    icon: PhoneCall,
  },
];

const limitations = [
  {
    title: 'Building status is not apartment status.',
    description: 'A building appearing in the source list does not prove that every apartment—or any particular apartment—is rent stabilized.',
  },
  {
    title: 'Stabili does not track vacancies.',
    description: 'A record does not mean an apartment is currently available to rent.',
  },
  {
    title: 'Contact details can change.',
    description: 'Management and contact information may be incomplete, outdated, or unavailable.',
  },
  {
    title: 'Public records are imperfect.',
    description: 'Agency records and automated address, property, or management matching can contain source or matching errors.',
  },
  {
    title: 'Building Health is context, not a verdict.',
    description: 'Stabili Building Health is not a government rating, agency grade, legal finding, or determination that a building or apartment is safe or unsafe.',
  },
];

const dataSources = [
  {
    shortName: 'NYS HCR',
    name: 'NYS Homes and Community Renewal (DHCR)',
    description: 'Official rent-stabilized building lists—the starting record set for Stabili.',
    link: 'https://hcr.ny.gov',
  },
  {
    shortName: 'NYC HPD',
    name: 'NYC Housing Preservation & Development',
    description: 'Building registration, housing maintenance violations, complaints, and related building records.',
    link: 'https://hpd.nyc.gov',
  },
  {
    shortName: 'NYC DOF',
    name: 'NYC Department of Finance',
    description: 'Property identifiers and assessment context used when records can be matched.',
    link: 'https://www.nyc.gov/site/finance/index.page',
  },
  {
    shortName: 'Open Data',
    name: 'NYC Open Data',
    description: 'The city data portal through which several property and housing datasets are published.',
    link: 'https://opendata.cityofnewyork.us',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => (
  <div className="about-page surface-base text-primary min-h-screen pb-28">
    <main className="about-editorial">
      <header className="about-hero">
        <div className="about-hero__copy">
          <h1>Find the building.<br /><span>Understand the record.</span><br />Contact management.</h1>
          <p>Stabili brings New York’s rent-stabilized building lists together with related public property, management, and building-condition records—so a scattered public record becomes a useful place to start.</p>
          <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => onNavigate('explore')}>
            Explore building records
          </Button>
        </div>

        <div className="about-record-motif" aria-hidden="true">
          <div className="about-record-motif__address">
            <span><Building2 /></span>
            <div><strong>One building address</strong><small>A shared point of reference</small></div>
          </div>
          <div className="about-record-motif__line" />
          <div className="about-record-motif__signals">
            <span><Database /> Official records</span>
            <span><ShieldCheck /> Clear context</span>
          </div>
        </div>
      </header>

      <section className="about-purpose" aria-labelledby="why-stabili-exists">
        <h2 id="why-stabili-exists">Public information is only useful when people can find their way through it.</h2>
        <div>
          <p>Official records are often spread across PDFs and separate agency datasets. Stabili organizes them around a building address so renters and researchers can find the source entry, review related public information, and identify an owner or management contact when the record includes one.</p>
          <p>Each page is a research starting point. Addresses, property identifiers, and management names can be incomplete or difficult to match, so Stabili keeps ambiguity and unavailable fields visible.</p>
        </div>
      </section>

      <section className="about-workflow" aria-labelledby="how-stabili-works">
        <div className="about-section-heading">
          <h2 id="how-stabili-works">How Stabili works</h2>
          <p>From an official source entry to a more understandable building record.</p>
        </div>
        <ol className="about-steps">
          {steps.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <span className="about-step__icon"><Icon aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-meaning" aria-labelledby="what-the-data-means">
        <div className="about-section-heading">
          <h2 id="what-the-data-means">What the data means</h2>
          <p>The distinction between a source record and an interpretation matters.</p>
        </div>
        <div className="about-meaning__grid">
          <article className="about-meaning__official">
            <Database aria-hidden="true" />
            <h3>Official source data</h3>
            <p>A building appearing in Stabili means it appears in the source rent-stabilized building file represented by the current generated dataset.</p>
            <strong>Related city records are attached only when the matching process finds a sufficiently clear connection.</strong>
          </article>
          <article className="about-meaning__stabili">
            <ShieldCheck aria-hidden="true" />
            <h3>Stabili interpretation</h3>
            <p>Building Health summarizes selected public condition records to make them easier to review.</p>
            <strong>It is a Stabili-generated interpretation—not an agency grade, government rating, legal finding, or safety determination.</strong>
          </article>
        </div>
      </section>

      <section className="about-limitations" aria-labelledby="important-limitations">
        <div className="about-limitations__intro">
          <h2 id="important-limitations">Important limitations</h2>
          <p>Public data can offer useful context without answering every question. These boundaries are part of reading a Stabili record responsibly.</p>
        </div>
        <div className="about-limitations__list">
          {limitations.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
        <p className="about-limitations__guidance">For an apartment’s official rent history or a legal determination, contact NYS Homes and Community Renewal or seek qualified tenant guidance.</p>
      </section>

      <section className="about-sources" aria-labelledby="source-transparency">
        <div className="about-sources__intro">
          <h2 id="source-transparency">Source transparency</h2>
          <p>Stabili reads committed, generated data rather than querying city services live in your browser. Source names, dates, matching notes, and unavailable states stay close to the records they qualify.</p>
        </div>
        <div className="about-source-list">
          {dataSources.map((source) => (
            <a key={source.name} href={source.link} target="_blank" rel="noreferrer">
              <span className="about-source-list__mark">{source.shortName}</span>
              <span className="about-source-list__body"><strong>{source.name}</strong><small>{source.description}</small></span>
              <ExternalLink aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="about-close" aria-labelledby="start-with-an-address">
        <div>
          <h2 id="start-with-an-address">Start with an address.</h2>
          <p>Search the current generated record set and see the public record in context.</p>
        </div>
        <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => onNavigate('explore')}>
          Explore Stabili
        </Button>
      </section>
    </main>
  </div>
);
