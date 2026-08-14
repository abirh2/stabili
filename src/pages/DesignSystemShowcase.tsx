import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Badge, BuildingHealthBadge } from '../components/common/Badge';
import { FilterChip } from '../components/common/FilterChip';
import { SearchInput, TextInput } from '../components/common/Input';
import { Route } from '../types';
import { 
  ShieldCheck, 
  Mail, 
  Bookmark, 
  Layers, 
  Palette, 
  Type, 
  LayoutGrid, 
  Component 
} from 'lucide-react';

interface DesignSystemShowcaseProps {
  onNavigate: (route: Route) => void;
}

export const DesignSystemShowcase: React.FC<DesignSystemShowcaseProps> = ({ onNavigate }) => {
  const [testSearch, setTestSearch] = useState('3151 Perry Avenue');
  const [selectedDemoFilter, setSelectedDemoFilter] = useState('Bronx');

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-slate-800 pb-32">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-24 md:pt-28 space-y-8">
        {/* Intro */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full mb-3 border border-teal-200/60">
            <Layers className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-xs font-medium">
              Stabili Design System
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
            Design Tokens & Components
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
            A calm, refined visual language with subtle 1px borders, 12–16px radii, and crisp slate typography for NYC rent-stabilized building exploration.
          </p>
        </div>

        {/* 1. Color Palette Section */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">1. Color Palette Tokens</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-teal-600 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-white/90">#0D9488</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Teal 600</p>
              <p className="text-[10px] text-slate-500">Primary accent</p>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-teal-700 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-white/90">#0F766E</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Teal 700</p>
              <p className="text-[10px] text-slate-500">Active / hover</p>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-[#F8F9FA] border border-slate-200 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-slate-800">#F8F9FA</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Surface Canvas</p>
              <p className="text-[10px] text-slate-500">Off-white background</p>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-white border border-slate-200 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-slate-800">#FFFFFF</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Surface Card</p>
              <p className="text-[10px] text-slate-500">Primary container</p>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-amber-500 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-white/90">#F59E0B</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Caution Amber</p>
              <p className="text-[10px] text-slate-500">Fair condition</p>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <div className="h-12 rounded-lg bg-rose-500 mb-2 flex items-end p-1.5">
                <span className="text-[10px] font-mono text-white/90">#EF4444</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">Alert Rose</p>
              <p className="text-[10px] text-slate-500">Open violations</p>
            </div>
          </div>
        </section>

        {/* 2. Typography Ladder */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Type className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">2. Typography Hierarchy</h2>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Display · 36px / Semi-Bold / Tracking -0.025em
              </span>
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Rent-stabilized living in NYC.
              </p>
            </div>

            <div className="pt-4">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Headline-LG · 24px / Semi-Bold
              </span>
              <p className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                3151 Perry Avenue, Norwood
              </p>
            </div>

            <div className="pt-4">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Headline-MD · 18px / Semi-Bold
              </span>
              <p className="text-lg font-semibold text-slate-900">
                Building Overview & Health Indicators
              </p>
            </div>

            <div className="pt-4">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Body-MD · 14px / Regular
              </span>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Official housing records provide full transparency on building registration, maintenance history, and ownership.
              </p>
            </div>

            <div className="pt-4">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Label-SM · 11px / Medium / Uppercase Tracking
              </span>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                MANAGING AGENT · REGISTERED WITH HPD
              </p>
            </div>
          </div>
        </section>

        {/* 3. Button Component Matrix */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Component className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">3. Button Component Matrix</h2>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="subtle-teal">Subtle Teal</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Variant</Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-2">
            <Button variant="primary" leftIcon={<Mail className="w-4 h-4" />}>
              Button with Left Icon
            </Button>
            <Button variant="secondary" leftIcon={<Bookmark className="w-4 h-4" />}>
              Save Building
            </Button>
            <Button variant="primary" size="sm">
              Small Button
            </Button>
            <Button variant="primary" size="lg">
              Large Action
            </Button>
          </div>
        </section>

        {/* 4. Badges and Status Indicators */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">4. Badges & Status Indicators</h2>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <Badge variant="stabilized">Rent-stabilized record</Badge>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/70">
              <Layers className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Garden complex</span>
            </span>
            <BuildingHealthBadge health="Good" />
            <BuildingHealthBadge health="Fair" />
            <BuildingHealthBadge health="Needs Attention" />
            <Badge variant="violations">14 Open Violations</Badge>
            <Badge variant="unit-count">42 Units</Badge>
            <Badge variant="verified">Verified Landlord</Badge>
          </div>
        </section>

        {/* 5. Address Formats & Complex Representations */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">5. NYC Address & Complex Representations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Example 1: Address Range + Secondary Line */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Address Range & Secondary Line
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">172-182 Castleton Avenue</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-slate-400">Also associated with</span>{' '}
                  <span className="text-slate-700 font-medium">351 Woodstock Ave</span>
                </p>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>Garden complex</span>
              </div>
            </div>

            {/* Example 2: Queens Hyphenated Range */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Multi-Building Courtyard Colony
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">32-20 - 32-34 89th Street</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-slate-400">Also associated with</span>{' '}
                  <span className="text-slate-700 font-medium">89-02 34th Avenue</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Garden complex</span>
                </span>
                <span className="text-xs text-teal-800 font-medium underline">View related buildings</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Inputs and Filter Chips */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">6. Form Inputs & Filter Chips</h2>
          </div>

          <div className="space-y-5 max-w-2xl">
            <SearchInput
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              onClear={() => setTestSearch('')}
            />

            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Borough"
                options={['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx']}
                selectedValue={selectedDemoFilter}
                onSelect={(val) => setSelectedDemoFilter(val)}
              />
              <FilterChip
                label="Building condition"
                options={['All', 'Good', 'Fair', 'Needs Attention']}
              />
              <FilterChip
                label="Building size"
                options={['All', '10-25 units', '26-50 units', '50+ units']}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <TextInput
                label="Full Name"
                placeholder="Jane Renter"
                defaultValue="Alex Rivera"
              />
              <TextInput
                label="Contact Email"
                placeholder="alex@example.com"
                helperText="We will send direct inquiry updates here"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
