import Image from 'next/image'
import Navbar from '@/components/Navbar'

export default function API() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-blue-500/30 mb-8 font-sans" style={{background: "rgba(59, 130, 246, 0.15)"}}>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white">400+ Healthcare Integrations</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-8 font-manrope font-medium">
            The Unified Healthcare
            <br/>
            <span className="text-blue-400 font-manrope font-medium">API Platform</span>
          </h1>
          
          <p className="text-xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto font-sans">
            One API to connect every healthcare system. Abstract away the complexity of EHRs, labs, pharmacies, and insurance providers with our MCP-powered integration layer.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
              <span className="font-sans">Get API Key</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] ml-2"><path d="m9 18 6-6-6-6"></path></svg>
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20" style={{background: "rgba(255, 255, 255, 0.03)"}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>
              <span className="font-sans">View Docs</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">400+</div>
            <p className="text-sm text-white/60 font-sans">Healthcare Systems</p>
          </div>
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">99.9%</div>
            <p className="text-sm text-white/60 font-sans">Uptime SLA</p>
          </div>
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">&lt;200ms</div>
            <p className="text-sm text-white/60 font-sans">Average Response</p>
          </div>
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">10M+</div>
            <p className="text-sm text-white/60 font-sans">API Calls/Month</p>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Built for Healthcare Developers</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">Our API is designed from the ground up to handle healthcare's unique requirements—compliance, security, and complex data formats.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-2xl text-white mb-6 font-manrope font-medium">Universal Healthcare Connectivity</h3>
              <p className="text-white/60 mb-8 font-sans">Connect to any healthcare system with a single, consistent API. We handle the complexity of FHIR, HL7, custom schemas, and legacy formats.</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-white/80 font-sans">Epic, Cerner, Allscripts, athenahealth</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-white/80 font-sans">LabCorp, Quest, local lab networks</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-white/80 font-sans">CVS, Walgreens, independent pharmacies</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-white/80 font-sans">Aetna, BCBS, Humana, Medicare/Medicaid</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(0, 0, 0, 0.3)"}}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-white/40 ml-2 font-geist-mono">api-example.js</span>
              </div>
              <pre className="text-sm text-white/80 font-geist-mono leading-relaxed"><code>{`// Connect to any EHR
const patient = await fuse.ehr.getPatient({
  id: "patient-123",
  system: "epic"
});

// Get lab results from any provider
const labs = await fuse.labs.getResults({
  patientId: "patient-123",
  provider: "labcorp",
  testType: "blood-panel"
});

// Check insurance coverage
const coverage = await fuse.insurance.verify({
  patientId: "patient-123",
  procedure: "mri-scan",
  provider: "aetna"
});`}</code></pre>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">HIPAA Compliant</h4>
              <p className="text-sm text-white/60 font-sans">Built-in encryption, audit logs, and compliance controls. SOC 2 Type II certified with BAA agreements available.</p>
            </div>
            
            <div className="rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Real-time Updates</h4>
              <p className="text-sm text-white/60 font-sans">Get instant notifications when patient data changes across any connected system via webhooks and WebSocket connections.</p>
            </div>
            
            <div className="rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Enterprise Ready</h4>
              <p className="text-sm text-white/60 font-sans">Multi-region deployment, 99.9% SLA, dedicated support, and custom integrations for enterprise healthcare organizations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Simple, Powerful API</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">Build complex healthcare workflows with just a few lines of code. Our SDKs and comprehensive documentation make integration seamless.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Patient Data Example */}
            <div>
              <h3 className="text-xl text-white mb-4 font-sans">Retrieve Patient Data</h3>
              <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(0, 0, 0, 0.3)"}}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-white/40 ml-2 font-geist-mono">patient-data.js</span>
                </div>
                <pre className="text-sm text-white/80 font-geist-mono leading-relaxed"><code>{`import { Fuse } from '@fuse/sdk';

const fuse = new Fuse({
  apiKey: process.env.FUSE_API_KEY
});

// Get comprehensive patient data
const patient = await fuse.patient.get({
  id: "patient-123",
  include: [
    "demographics",
    "medications", 
    "allergies",
    "conditions",
    "recent_visits"
  ]
});

console.log(patient.demographics.name);
// "John Doe"

console.log(patient.medications);
// [{ name: "Lisinopril", dosage: "10mg", frequency: "daily" }]`}</code></pre>
              </div>
            </div>

            {/* Workflow Example */}
            <div>
              <h3 className="text-xl text-white mb-4 font-sans">Schedule & Coordinate Care</h3>
              <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(0, 0, 0, 0.3)"}}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-white/40 ml-2 font-geist-mono">care-coordination.js</span>
                </div>
                <pre className="text-sm text-white/80 font-geist-mono leading-relaxed"><code>{`// Schedule appointment
const appointment = await fuse.scheduling.create({
  patientId: "patient-123",
  providerId: "fertility-clinic-abc",
  type: "consultation",
  preferredTime: "2024-01-15T10:00:00Z"
});

// Verify insurance coverage
const coverage = await fuse.insurance.verify({
  patientId: "patient-123",
  procedure: appointment.type,
  provider: appointment.providerId
});

// Send referral if covered
if (coverage.approved) {
  await fuse.referrals.send({
    from: "primary-care-dr",
    to: appointment.providerId,
    patient: "patient-123",
    reason: "fertility consultation"
  });
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Get Started in Minutes</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">From sandbox to production, our platform makes it easy to build and deploy healthcare integrations quickly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Get Your API Key</h4>
              <p className="text-sm text-white/60 font-sans">Sign up and get instant access to our sandbox environment with sample healthcare data.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Install Our SDK</h4>
              <p className="text-sm text-white/60 font-sans">Choose from our JavaScript, Python, or REST API to start building immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Deploy</h4>
              <p className="text-sm text-white/60 font-sans">Connect your production systems and start automating healthcare workflows.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 p-8" style={{background: "rgba(0, 0, 0, 0.3)"}}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-white/40 ml-2 font-geist-mono">quickstart.sh</span>
            </div>
            <pre className="text-sm text-white/80 font-geist-mono leading-relaxed"><code>{`# Install the Fuse SDK
npm install @fuse/sdk

# Set your API key
export FUSE_API_KEY="your-api-key-here"

# Run your first query
node -e "
import { Fuse } from '@fuse/sdk';
const fuse = new Fuse();
const patient = await fuse.patient.get({ id: 'demo-patient-123' });
console.log('Patient:', patient.name);
"`}</code></pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="relative lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12 overflow-hidden" style={{background: "rgba(59, 130, 246, 0.1)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Ready to Build Healthcare Solutions?</h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-sans">Get started with our API today and join thousands of developers building the future of healthcare.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
                <span className="font-sans">Get API Key</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] ml-2"><path d="m9 18 6-6-6-6"></path></svg>
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>
                <span className="font-sans">Read Documentation</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-12">
        <div className="border-t border-white/10 pt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div className="col-span-2">
              <span className="text-lg font-semibold tracking-tight text-white font-sans">Fuse</span>
              <p className="text-sm text-white/60 mt-4 font-sans">The unified healthcare platform for developers.</p>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Platform</h6>
              <ul className="space-y-3">
                <li><a href="/api" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">API</a></li>
                <li><a href="/workflows" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Workflows</a></li>
                <li><a href="/assistant" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Assistant</a></li>
                <li><a href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Resources</h6>
              <ul className="space-y-3">
                <li><a href="/docs" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Documentation</a></li>
                <li><a href="/docs" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Tutorials</a></li>
                <li><a href="/contact" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Support</a></li>
                <li><a href="/contact" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">API Status</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Company</h6>
              <ul className="space-y-3">
                <li><a href="/about" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">About Us</a></li>
                <li><a href="/about" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Careers</a></li>
                <li><a href="/about" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Blog</a></li>
                <li><a href="/contact" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Contact</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Legal</h6>
              <ul className="space-y-3">
                <li><a href="/legal" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Terms of Service</a></li>
                <li><a href="/legal" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Privacy Policy</a></li>
                <li><a href="/legal" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">HIPAA</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between mt-12 border-t border-white/10 pt-8">
            <p className="text-sm text-white/40 font-sans">© 2025 Fuse Health, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg></a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
