import React from 'react';
import { Route } from '../types';
import { Button } from '../components/common/Button';
import { ShieldCheck, Database, HelpCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: Route) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const dataSources = [
    {
      name: 'NYC Housing Preservation & Development (HPD)',
      desc: 'Building registration, code violations, open 311 complaints, and order to repair records.',
      link: 'https://hpd.nyc.gov',
    },
    {
      name: 'NYS Homes and Community Renewal (DHCR)',
      desc: 'Official rent-stabilized building lists and statewide rent regulation oversight data.',
      link: 'https://hcr.ny.gov',
    },
    {
      name: 'NYC Department of Finance (DOF)',
      desc: 'Real Property Tax Assessment, property deed history, and tax benefit programs (e.g. 421-a, J-51).',
      link: 'https://www.nyc.gov/site/finance/index.page',
    },
    {
      name: 'NYC OpenData',
      desc: 'Citywide spatial data, Building Identification Numbers (BIN), and Borough-Block-Lot (BBL) tax records.',
      link: 'https://opendata.cityofnewyork.us',
    },
  ];

  const faqs = [
    {
      q: 'How does Stabili know if a building is rent-stabilized?',
      a: 'We cross-reference public building records released by the New York State Division of Housing and Community Renewal (DHCR) and NYC HPD building registration filings. Buildings generally enter stabilization through pre-1974 construction (with 6+ units) or via municipal tax incentives like 421-a and J-51.',
    },
    {
      q: 'Does finding a building here guarantee a vacant apartment?',
      a: 'No. Stabili provides the registry of buildings that contain stabilized units. Renters can use our direct management directory to contact landlords or managing agents and ask to be placed on waiting lists or notified of upcoming vacancies.',
    },
    {
      q: 'How can a tenant check their individual apartment rent history?',
      a: 'Tenants residing in New York can contact NYS DHCR directly to request an official "Rent History" record via mail or the DHCR online portal. This helps confirm whether past rent increases adhered to the NYC Rent Guidelines Board orders.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-slate-800 pb-32">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-24 md:pt-28 space-y-8">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto pt-4 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full mb-3 border border-teal-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-xs font-medium">
              Public Data · Renter Transparency
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Demystifying NYC Rent Stabilization.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2.5 leading-relaxed">
            Stabili was designed to give everyday renters the same clarity that brokers and property owners have had for decades.
          </p>
        </section>

        {/* Mission Card */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 md:p-10">
          <div className="max-w-3xl">
            <span className="text-[11px] font-medium text-teal-800 uppercase tracking-wider block mb-1.5">
              Our Mission
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 mb-3">
              Building trust through verifiable public records.
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Roughly one million apartments in New York City are covered by rent stabilization laws. Yet finding which buildings qualify and identifying who to contact has traditionally been locked behind archaic PDF listings and disconnected city databases.
              </p>
              <p>
                Stabili indexes official city and state databases to bring together building histories, landlord portfolios, and direct contact avenues into a calm, transparent consumer experience.
              </p>
            </div>
          </div>
        </section>

        {/* Public Data Sources Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Official Public Data Sources
              </h2>
              <p className="text-xs text-slate-500">Authoritative city and state records indexed by Stabili</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((source) => (
              <a
                key={source.name}
                href={source.link}
                target="_blank"
                rel="noreferrer"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all group block"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-800 transition-colors">
                    {source.name}
                  </h3>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {source.desc}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500">Common questions about NYC rent stabilization and building data</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 space-y-4 pt-1">
            {faqs.map((faq, i) => (
              <div key={i} className={i > 0 ? 'pt-4' : ''}>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200/80">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Ready to find your next home?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 max-w-md mx-auto">
            Search rent-stabilized buildings across all 5 NYC boroughs with verified records.
          </p>
          <Button
            variant="primary"
            size="md"
            isPill
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('explore')}
            className="px-6"
          >
            Start Exploring Buildings
          </Button>
        </section>
      </main>
    </div>
  );
};
