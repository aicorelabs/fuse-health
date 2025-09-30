import Navbar from "@/components/Navbar";

export default function About() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-8 font-manrope font-medium">
            Building the
            <br/>
            <span className="text-blue-400 font-manrope font-medium">Future</span> of Healthcare
          </h1>
          
          <p className="text-xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto font-sans">
            Fuse is on a mission to eliminate healthcare integration complexity. We believe that seamless interoperability should be the foundation of modern healthcare, not its biggest obstacle.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Our Mission</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">To create the unified orchestration platform that becomes the nervous system of modern healthcare—connecting every system, automating every workflow, and enabling every healthcare professional to focus on what matters most: caring for patients.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Compliance First</h4>
              <p className="text-sm text-white/60 font-sans">Built from the ground up with HIPAA, SOC 2, and healthcare regulations at the core. We understand that in healthcare, compliance isn&apos;t optional.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Human-Centered</h4>
              <p className="text-sm text-white/60 font-sans">Our AI assists, never replaces. Every critical healthcare decision maintains human oversight and control, ensuring safety and accountability.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30" style={{background: "rgba(59, 130, 246, 0.15)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">Developer First</h4>
              <p className="text-sm text-white/60 font-sans">Built by developers, for developers. Our APIs are intuitive, our documentation is comprehensive, and our tools are designed for efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12" style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Leadership Team</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">Healthcare veterans and technology innovators working together to transform how healthcare systems communicate.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 border border-white/10" style={{background: "rgba(255, 255, 255, 0.03)"}}></div>
              <h4 className="text-lg font-semibold text-white mb-2 font-sans">Dr. Sarah Chen</h4>
              <p className="text-sm text-blue-400 mb-3 font-sans">CEO & Co-founder</p>
              <p className="text-xs text-white/60 font-sans">Former VP of Digital Health at Mayo Clinic. MD from Johns Hopkins, MBA from Wharton.</p>
            </div>
            
            <div className="text-center rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 border border-white/10" style={{background: "rgba(255, 255, 255, 0.03)"}}></div>
              <h4 className="text-lg font-semibold text-white mb-2 font-sans">Alex Rodriguez</h4>
              <p className="text-sm text-blue-400 mb-3 font-sans">CTO & Co-founder</p>
              <p className="text-xs text-white/60 font-sans">Former Staff Engineer at Google Health. Built integration platforms serving 100M+ patients.</p>
            </div>
            
            <div className="text-center rounded-2xl border border-white/10 p-8" style={{background: "rgba(255, 255, 255, 0.02)"}}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 border border-white/10" style={{background: "rgba(255, 255, 255, 0.03)"}}></div>
              <h4 className="text-lg font-semibold text-white mb-2 font-sans">Dr. Michael Torres</h4>
              <p className="text-sm text-blue-400 mb-3 font-sans">Chief Medical Officer</p>
              <p className="text-xs text-white/60 font-sans">Emergency Medicine physician and former HIMSS board member. Champion of healthcare interoperability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="relative lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12 overflow-hidden" style={{background: "rgba(59, 130, 246, 0.1)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Join Our Mission</h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-sans">Interested in partnering with us or joining our team? We&apos;d love to hear from you.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button type="button" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
                <span className="font-sans">Get in Touch</span>
              </button>
              <button type="button" className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20" style={{background: "rgba(255, 255, 255, 0.03)"}}>
                <span className="font-sans">View Careers</span>
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
              <a href="https://twitter.com" className="text-white/60 hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://github.com" className="text-white/60 hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              <a href="https://linkedin.com" className="text-white/60 hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
