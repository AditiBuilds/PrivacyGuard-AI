import React, { useState } from 'react';
import { ShieldCheck, Sliders, AlertOctagon, HelpCircle, BookOpen, Calculator } from 'lucide-react';
import { RiskBadge } from '../components/common/RiskBadge';

interface RuleDef {
  id: string;
  name: string;
  category: string;
  weight: string;
  condition: string;
  action: string;
}

const RULES: RuleDef[] = [
  {
    id: 'RULE-FINANCIAL-01',
    name: 'Payment & PCI-DSS Segregation',
    category: 'Financial Data',
    weight: '+35 pts / finding (max 70)',
    condition: 'Valid Luhn 13-19 digit credit card number detected',
    action: 'Requires human review; auto-redacts numbers',
  },
  {
    id: 'RULE-SECRETS-02',
    name: 'Credentials & Infrastructure Secrets',
    category: 'Secrets & Auth',
    weight: '+35 pts / finding (max 70)',
    condition: 'AWS key, JWT token, Bearer auth, or explicit password string',
    action: 'Quarantines output; requires reviewer confirmation',
  },
  {
    id: 'RULE-GOV-ID-03',
    name: 'Government Identifiers (SSN)',
    category: 'National Identity',
    weight: '+30 pts / finding (max 60)',
    condition: 'US SSN (xxx-xx-xxxx) pattern match',
    action: 'Requires human approval; mandatory redaction',
  },
  {
    id: 'RULE-CONTACT-04',
    name: 'Direct Contact Identifiers',
    category: 'Direct PII',
    weight: '+12 pts / finding (max 36)',
    condition: 'Email address or validated phone number',
    action: 'Standard token replacement ([EMAIL_1], [PHONE_1])',
  },
  {
    id: 'RULE-INDIRECT-05',
    name: 'Quasi-Identifiers & Telemetry',
    category: 'Indirect PII',
    weight: '+8 pts / finding (max 24)',
    condition: 'IPv4/IPv6 address, individual person name, or location',
    action: 'Token substitution where necessary to prevent re-identification',
  },
  {
    id: 'RULE-VOLUME-06',
    name: 'High Entity Density Multiplier',
    category: 'Data Volume',
    weight: '+15 pts bonus',
    condition: 'Document contains > 5 distinct sensitive entities',
    action: 'Elevates base risk tier',
  },
  {
    id: 'RULE-PURPOSE-07',
    name: 'Data Minimization & Purpose Legitimacy',
    category: 'Policy Compliance',
    weight: '+35 pts (Auto-Block)',
    condition: 'Purpose is marketing_profiling or unauthorized export',
    action: 'Blocks AI pipeline execution immediately',
  },
  {
    id: 'RULE-EXTERNAL-DEST-08',
    name: 'External Boundary Enforcement',
    category: 'Boundary Control',
    weight: '+40 pts (Auto-Block)',
    condition: 'Destination requested is external_api while local-only enabled',
    action: 'Prohibits network egress; confines execution locally',
  },
];

export const RiskAnalysisPage: React.FC = () => {
  // Simulator state
  const [creditCards, setCreditCards] = useState(0);
  const [secrets, setSecrets] = useState(0);
  const [ssns, setSsns] = useState(0);
  const [contacts, setContacts] = useState(1);
  const [indirects, setIndirects] = useState(1);
  const [purpose, setPurpose] = useState('support_triage');
  const [destination, setDestination] = useState('local');

  // Compute simulated score
  let simScore = 0;
  let reasons: string[] = [];
  let triggeredRules: string[] = [];
  let blocked = false;

  const totalEntities = creditCards + secrets + ssns + contacts + indirects;

  if (creditCards > 0) {
    const pts = Math.min(creditCards * 35, 70);
    simScore += pts;
    triggeredRules.push('RULE-FINANCIAL-01');
    reasons.push(`${creditCards} credit cards detected (+${pts} pts)`);
  }
  if (secrets > 0) {
    const pts = Math.min(secrets * 35, 70);
    simScore += pts;
    triggeredRules.push('RULE-SECRETS-02');
    reasons.push(`${secrets} credentials/secrets detected (+${pts} pts)`);
  }
  if (ssns > 0) {
    const pts = Math.min(ssns * 30, 60);
    simScore += pts;
    triggeredRules.push('RULE-GOV-ID-03');
    reasons.push(`${ssns} government identifiers (SSN) detected (+${pts} pts)`);
  }
  if (contacts > 0) {
    const pts = Math.min(contacts * 12, 36);
    simScore += pts;
    triggeredRules.push('RULE-CONTACT-04');
    reasons.push(`${contacts} contact identifiers (+${pts} pts)`);
  }
  if (indirects > 0) {
    const pts = Math.min(indirects * 8, 24);
    simScore += pts;
    triggeredRules.push('RULE-INDIRECT-05');
    reasons.push(`${indirects} indirect identifiers (+${pts} pts)`);
  }
  if (totalEntities > 5) {
    simScore += 15;
    triggeredRules.push('RULE-VOLUME-06');
    reasons.push(`High density with ${totalEntities} entities (+15 pts)`);
  }
  if (purpose === 'marketing_profiling') {
    simScore += 35;
    blocked = true;
    triggeredRules.push('RULE-PURPOSE-07');
    reasons.push(`Unapproved purpose '${purpose}' violates data minimization (+35 pts, BLOCKED)`);
  }
  if (destination === 'external_api') {
    simScore += 40;
    blocked = true;
    triggeredRules.push('RULE-EXTERNAL-DEST-08');
    reasons.push('External forwarding prohibited under local-only policy (+40 pts, BLOCKED)');
  }

  simScore = Math.min(Math.max(simScore, 0), 100);

  let riskLevel = 'Low';
  if (simScore >= 85) riskLevel = 'Critical';
  else if (simScore >= 60) riskLevel = 'High';
  else if (simScore >= 30) riskLevel = 'Medium';

  const reviewRequired = simScore >= 60 || creditCards > 0 || secrets > 0 || ssns > 0 || blocked;
  const recommendedAction = blocked ? 'block_processing' : (reviewRequired ? 'require_human_review' : 'auto_approve');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Disclaimer Alert */}
      <div className="p-4 bg-navy-900/5 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">
            Explainable & Transparent Risk Architecture
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            PrivacyGuard AI computes deterministic risk scores based on explicit mathematical weights and policy rules.
            Notice: This system functions as an educational prototype and decision-support assistant; it does not constitute formal legal certification for GDPR or regulatory compliance.
          </span>
        </div>
      </div>

      {/* Interactive Risk Simulator */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-navy-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gold-500" />
              Interactive Risk Scoring Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adjust findings count and parameters to observe real-time score calculation and policy rule activations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {simScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </span>
            <RiskBadge level={riskLevel} score={simScore} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Credit Cards (Luhn Verified)</span>
                <span className="font-bold">{creditCards}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                value={creditCards}
                onChange={e => setCreditCards(parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Credentials & Secrets</span>
                <span className="font-bold">{secrets}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                value={secrets}
                onChange={e => setSecrets(parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Government IDs / SSN</span>
                <span className="font-bold">{ssns}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                value={ssns}
                onChange={e => setSsns(parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Direct Contact (Emails, Phones)</span>
                <span className="font-bold">{contacts}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={contacts}
                onChange={e => setContacts(parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span>Quasi-Identifiers (IPs, Names, Locations)</span>
                <span className="font-bold">{indirects}</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={indirects}
                onChange={e => setIndirects(parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Purpose
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full p-2 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="support_triage">Support Triage</option>
                  <option value="document_summary">Document Summary</option>
                  <option value="marketing_profiling">Marketing Profiling (Violates Policy)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full p-2 rounded-lg text-xs bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="local">Local Processing</option>
                  <option value="external_api">External Cloud API</option>
                </select>
              </div>
            </div>
          </div>

          {/* Real-time Simulator Output */}
          <div className="bg-slate-50 dark:bg-navy-950 p-5 rounded-xl border border-slate-200/80 dark:border-navy-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Calculated Policy Decision
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-navy-800">
                  <span className="text-slate-500">Recommended Action:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${blocked ? 'bg-rose-100 text-rose-700' : (reviewRequired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}`}>
                    {recommendedAction}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-navy-800">
                  <span className="text-slate-500">Human Review Gate:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {reviewRequired ? 'Triggered (Mandatory Pause)' : 'Not Required (Auto-Approved)'}
                  </span>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 block mb-1">Triggered Rules:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {triggeredRules.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-gold-400">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs pt-2">
                  <span className="text-slate-500 block mb-1">Active Reasons:</span>
                  <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {reasons.map((r, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-gold-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-navy-800 text-[10px] text-slate-400">
              Backend enforcement prevents LLM or frontend code from bypassing policy blocks.
            </div>
          </div>
        </div>
      </div>

      {/* Rules Registry Table */}
      <div className="bg-white dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Documented Risk Rules Matrix ({RULES.length} Rules)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-navy-700">
              <tr>
                <th className="py-2.5 px-4">Rule Identifier</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Weight</th>
                <th className="py-2.5 px-4">Trigger Condition</th>
                <th className="py-2.5 px-4">Enforced Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
              {RULES.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-700/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-navy-800 dark:text-gold-400">
                    {r.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {r.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {r.category}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {r.weight}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {r.condition}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {r.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
