import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../components/common/Button';
import type { Route } from '../types';

interface AboutPageProps {
  onNavigate: (route: Route) => void;
}

const dataSources = [
  {
    name: 'NYC Housing Preservation & Development (HPD)',
    description: 'Building registration, housing maintenance violations, complaints, and related building records used in the generated dataset.',
    link: 'https://hpd.nyc.gov',
  },
  {
    name: 'NYS Homes and Community Renewal (DHCR)',
    description: 'The official rent-stabilized building lists that form Stabili’s starting record set.',
    link: 'https://hcr.ny.gov',
  },
  {
    name: 'NYC Department of Finance (DOF)',
    description: 'Property identifiers and assessment context used when records can be matched.',
    link: 'https://www.nyc.gov/site/finance/index.page',
  },
  {
    name: 'NYC OpenData',
    description: 'The city data portal through which several property and housing datasets are published.',
    link: 'https://opendata.cityofnewyork.us',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => (
  <div className="surface-base text-primary min-h-screen pb-28">
    <main className="editorial-page">
      <header className="editorial-intro">
        <h1 className="type-page-title">Understand the building record.</h1>
        <p>Stabili brings a reproducible snapshot of New York rent-stabilized building lists together with related public property, management, and building-condition records.</p>
      </header>

      <div className="editorial-body">
        <section aria-labelledby="what-stabili-does">
          <h2 id="what-stabili-does">What Stabili does</h2>
          <p>Official records are often spread across PDFs and separate agency datasets. Stabili organizes those records around a building address so renters and researchers can find the source entry, review related public information, and identify an owner or management contact when the record includes one.</p>
          <p>Each Stabili page is a research starting point. Addresses, property identifiers, and management names can be incomplete or difficult to match, so ambiguity and unavailable fields remain visible.</p>
        </section>

        <section aria-labelledby="what-the-data-means">
          <h2 id="what-the-data-means">What the data means</h2>
          <p>A building appearing in Stabili means it appears in the source rent-stabilized building file represented by the current generated dataset. Related city records are attached when the matching process finds a sufficiently clear connection.</p>
          <p>The building-health summary is a Stabili interpretation of selected public condition records. It is not an agency grade, a legal finding, or a determination that a building or apartment is safe or unsafe.</p>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits">What Stabili does not guarantee</h2>
          <ul>
            <li>That a particular apartment is rent-stabilized.</li>
            <li>That an apartment is available to rent.</li>
            <li>That management or contact information is current or complete.</li>
            <li>That every agency record matched to a building is free from source or matching errors.</li>
          </ul>
          <p>For an apartment’s official rent history or a legal determination, contact NYS Homes and Community Renewal or seek qualified tenant guidance.</p>
        </section>

        <section aria-labelledby="source-transparency">
          <h2 id="source-transparency">Source transparency</h2>
          <p>Stabili reads committed, generated data rather than querying city services live in your browser. Source names, dates, matching notes, and unavailable states are kept close to the records they qualify.</p>
          <div className="editorial-sources">
            {dataSources.map((source) => (
              <a key={source.name} href={source.link} target="_blank" rel="noreferrer">
                <span><strong>{source.name}</strong><small>{source.description}</small></span>
                <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="editorial-action" aria-labelledby="research-a-building">
          <div>
            <h2 id="research-a-building">Research a building</h2>
            <p>Search the current generated record set by address, borough, ZIP code, or management name.</p>
          </div>
          <Button variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => onNavigate('explore')}>Explore building records</Button>
        </section>
      </div>
    </main>
  </div>
);
