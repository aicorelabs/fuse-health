import Image from 'next/image'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Content */}
          <div className="order-2 lg:order-1">
            <div className="p-10 lg:p-12 shadow-2xl border border-white/10 rounded-3xl" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[1.5] fill-amber-400 w-[14px] h-[14px]" style={{width: "14px", height: "14px", color: "rgb(251, 191, 36)"}}><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-[1.5] text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-[1.5] text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-[1.5] text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                </div>
                <span className="text-xs font-medium text-white/50 font-sans">4.9 • 1,200+ healthcare developers</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-8 font-manrope font-medium">
                The Healthcare<br/>
                <span className="text-blue-400 font-manrope font-medium">Orchestration</span> Layer.
              </h1>
              
              <p className="text-lg text-white/60 leading-relaxed mb-12 font-sans">
                Fuse is the unified platform that connects hundreds of disparate healthcare APIs, enabling you to build compliant, automated workflows with an intelligent, developer-first toolkit.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-blue-500/10 text-white text-sm font-medium border border-blue-500/20 transition-all duration-300 hover:border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.08)"}}>
                  <span className="font-sans">Start Building</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] ml-2"><path d="m9 18 6-6-6-6"></path></svg>
                </button>
                <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>
                  <span className="font-sans">View Docs</span>
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-10 h-10 flex border-white/10 border rounded-xl mr-auto mb-3 ml-auto items-center justify-center" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[1.5] w-[16px] h-[16px]" style={{width: "16px", height: "16px", color: "rgb(255, 255, 255)"}}><path d="M9 12l2 2 4-4"></path><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.999.398-.999.95v8a1 1 0 0 0 1 1z"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path></svg>
                  </div>
                  <div className="text-xs font-medium text-white/70 font-sans">Unified API</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[1.5] w-[16px] h-[16px]" style={{width: "16px", height: "16px", color: "rgb(255, 255, 255)"}}><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 9h6v6H9z"></path><path d="m9 1 3 3 3-3"></path></svg>
                  </div>
                  <div className="text-xs font-medium text-white/70 font-sans">Workflows</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-[1.5] w-[16px] h-[16px]" style={{width: "16px", height: "16px", color: "rgb(255, 255, 255)"}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path></svg>
                  </div>
                  <div className="text-xs font-medium text-white/70 font-sans">AI Assistant</div>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2">
            <div className="overflow-hidden border border-white/10 rounded-3xl shadow-2xl" style={{background: "rgba(255, 255, 255, 0.03)"}}>
              <div className="absolute top-8 left-8 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium border border-white/20 z-10" style={{background: "rgba(59, 130, 246, 0.15)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white font-sans">API Status: Online</span>
              </div>

              <Image src="/placeholder.svg" alt="Fuse Healthcare Dashboard" width={600} height={650} className="w-full h-[500px] lg:h-[650px] object-cover" />

              <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 gap-6">
                <div className="border-white/10 border rounded-2xl pt-6 pr-6 pb-6 pl-6" style={{background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
                  <div className="text-2xl text-white font-manrope font-medium">50+</div>
                  <div className="text-sm text-white/60 mt-1 font-sans">Healthcare APIs</div>
                </div>
                <div className="rounded-2xl p-6 border border-white/10" style={{background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
                  <div className="text-2xl text-white font-manrope font-medium">99.9%</div>
                  <div className="text-sm text-white/60 mt-1 font-sans">Uptime SLA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 space-y-20 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-12">
            <p className="uppercase text-sm font-medium text-white/40 tracking-wide mb-3 font-sans">Trusted Partners</p>
            <h3 className="text-2xl text-white tracking-tight mb-4 font-manrope font-medium">The Orchestration Layer for Modern Healthcare</h3>
            <p className="text-base text-white/60 max-w-2xl mx-auto font-sans">Leading healthcare organizations trust Fuse to eliminate integration complexity, reduce regulatory risk, and accelerate innovation.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">MAYO CLINIC</span>
              <p className="text-xs text-white/40 font-sans">Digital Health Platform</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">KAISER</span>
              <p className="text-xs text-white/40 font-sans">Patient Management</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">CLEVELAND CLINIC</span>
              <p className="text-xs text-white/40 font-sans">Clinical Workflows</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">JOHNS HOPKINS</span>
              <p className="text-xs text-white/40 font-sans">Research Integration</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">CEDARS-SINAI</span>
              <p className="text-xs text-white/40 font-sans">AI-Powered Diagnostics</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/10" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <span className="text-lg font-semibold text-white/60 hover:text-white/80 transition-colors duration-300 tracking-tight mb-2 font-sans">MOUNT SINAI</span>
              <p className="text-xs text-white/40 font-sans">Telemedicine Platform</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl text-white mb-2 font-manrope font-medium">500M+</div>
              <p className="text-sm text-white/60 font-sans">Patient Records Processed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl text-white mb-2 font-manrope font-medium">400+</div>
              <p className="text-sm text-white/60 font-sans">Healthcare Integrations</p>
            </div>
            <div className="text-center">
              <div className="text-3xl text-white mb-2 font-manrope font-medium">1,200+</div>
              <p className="text-sm text-white/60 font-sans">Developer Teams</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <p className="uppercase text-sm font-medium text-white/40 tracking-wide mb-3 font-sans">Platform Features</p>
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">The Complete Toolkit for Healthcare Orchestration</h3>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">From a unified API that abstracts away complexity to a compliant workflow engine, Fuse provides the developer-first tools needed to connect and automate healthcare.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Unified API */}
            <div className="relative rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M9 12l2 2 4-4"></path><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.999.398-.999.95v8a1 1 0 0 0 1 1z"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">The Unified API</h4>
              <p className="text-sm text-white/60 mb-6 font-sans">One API to connect them all. Integrate with over 400+ healthcare systems—EHRs, labs, pharmacies, and more—without writing custom code for each.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">MCP-Based Abstraction</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">FHIR, HL7 &amp; Custom Sources</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">HIPAA &amp; SOC 2 Compliant</span>
                </li>
              </ul>
            </div>
            
            {/* Workflow Builder */}
            <div className="relative rounded-2xl border border-blue-500/30 p-8" style={{background: "rgba(59, 130, 246, 0.05)"}}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 text-xs font-medium text-white rounded-full border border-blue-500/30 font-sans" style={{background: "rgba(59, 130, 246, 0.15)"}}>Most Popular</span>
              </div>
              
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 9h6v6H9z"></path><path d="m9 1 3 3 3-3"></path></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Compliant Workflows</h4>
              <p className="text-sm text-white/60 mb-6 font-sans">Automate complex processes with our deterministic, human-in-the-loop workflow engine, built to handle healthcare's unique regulatory needs.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Assisted, Not Autonomous</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Visual Low-Code Builder</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Full Audit Trails</span>
                </li>
              </ul>
            </div>
            
            {/* Chat Assistant */}
            <div className="relative rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path></svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Intelligent Assistance</h4>
              <p className="text-sm text-white/60 mb-6 font-sans">From developer-focused code generation to guided chatbot widgets for clinical staff, our AI accelerates every part of the workflow.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Developer Copilot</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Embeddable Chat Widgets</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="m9 12 2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  <span className="text-sm text-white/70 font-sans">Healthcare Domain Expertise</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24 mt-20">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <p className="uppercase text-sm font-medium text-white/40 tracking-wide mb-3 font-sans">How It Works</p>
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">From Fragmented to Fused in Three Steps</h3>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">Our developer-first workflow makes it simple to connect, orchestrate, and deploy complex healthcare integrations at scale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Connect with a Single API</h4>
              <p className="text-sm text-white/60 font-sans">Integrate with hundreds of healthcare systems using the Fuse Universal API. We handle the complexity of each unique endpoint for you.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Orchestrate Workflows</h4>
              <p className="text-sm text-white/60 font-sans">Use our low-code builder and SDK to design, test, and run compliant, multi-system workflows with built-in auditability and human-in-the-loop controls.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <span className="text-2xl font-bold text-blue-400 font-sans">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-4 font-sans">Deploy &amp; Embed</h4>
              <p className="text-sm text-white/60 font-sans">Embed your orchestrated workflows into any application or let non-technical users securely trigger them via our embeddable chatbot widgets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="uppercase text-sm font-medium text-white/40 tracking-wide mb-3 font-sans">For Developers</p>
              <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Built for Developers, Trusted by Healthcare</h3>
              <p className="text-lg text-white/60 mb-8 font-sans">Our SDKs, comprehensive documentation, and developer-first tooling make it seamless to build, test, and deploy complex healthcare workflows.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium text-white border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 font-sans" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>
                  Explore the Docs
                </button>
                <button className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium text-white/80 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/5 font-sans" style={{background: "rgba(255, 255, 255, 0.02)"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                  View on GitHub
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(0, 0, 0, 0.3)"}}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-white/40 ml-2 font-geist-mono">patient-intake.js</span>
              </div>
              <pre className="text-sm text-white/80 font-geist-mono leading-relaxed text-wrap"><code>{`import { Fuse } from '@fuse/sdk';

const fuse = new Fuse({
  apiKey: process.env.FUSE_API_KEY
});

// chat with configured providers to collect patient info

const fuseAgent = fuse.agent.create({
  model: 'gpt-4',
  tools: ['ehrLookup', 'insuranceVerification', 'appointmentScheduling']
});


await fuseAgent.sendMessage(
  { content: 'Collect patient info and schedule an appointment.' }
);


// Trigger the workflow
await intakeWorkflow.trigger({ id: 'patient-123' });`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <p className="uppercase text-sm font-medium text-white/40 tracking-wide mb-3 font-sans">Testimonials</p>
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Loved by Healthcare Developers</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="flex items-center gap-1 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
              </div>
              <p className="text-sm text-white/80 mb-4 font-sans">"Fuse has been a game-changer for our team. The unified API saved us months of development time."</p>
              <div className="flex items-center">
                <Image src="/placeholder.svg" alt="User Avatar" width={40} height={40} className="w-10 h-10 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-semibold text-white font-sans">Dr. Emily Carter</p>
                  <p className="text-xs text-white/60 font-sans">Lead Developer, HealthTech Solutions</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="flex items-center gap-1 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
              </div>
              <p className="text-sm text-white/80 mb-4 font-sans">"The workflow builder is incredibly powerful. We've automated complex clinical pathways in days, not months."</p>
              <div className="flex items-center">
                <Image src="/placeholder.svg" alt="User Avatar" width={40} height={40} className="w-10 h-10 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-semibold text-white font-sans">Dr. Ben Adams</p>
                  <p className="text-xs text-white/60 font-sans">CTO, NextGen Healthcare</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-6" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="flex items-center gap-1 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" className=""></path></svg>
              </div>
              <p className="text-sm text-white/80 mb-4 font-sans">"The AI assistant is like having a senior healthcare developer on call 24/7. It's an indispensable tool."</p>
              <div className="flex items-center">
                <Image src="/placeholder.svg" alt="User Avatar" width={40} height={40} className="w-10 h-10 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-semibold text-white font-sans">Dr. Sarah Chen</p>
                  <p className="text-xs text-white/60 font-sans">Founder, Digital Diagnostics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="relative lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12 overflow-hidden" style={{background: "rgba(59, 130, 246, 0.1)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Ready to Build the Future of Healthcare?</h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-sans">Join over 1,200 developer teams and start building faster with Fuse.</p>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
              <span className="font-sans">Start Your Free Trial</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[1.5] ml-2"><path d="m9 18 6-6-6-6"></path></svg>
            </button>
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
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">API</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Workflows</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Assistant</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Resources</h6>
              <ul className="space-y-3">
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Documentation</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Tutorials</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Support</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">API Status</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Company</h6>
              <ul className="space-y-3">
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">About Us</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Careers</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Blog</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Contact</a></li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">Legal</h6>
              <ul className="space-y-3">
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Terms of Service</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">Privacy Policy</a></li>
                <li><a href="/" className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans">HIPAA</a></li>
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
