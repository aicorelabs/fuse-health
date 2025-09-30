import Navbar from "@/components/Navbar";

export default function Assistant() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-blue-500/30 mb-8 font-sans" style={{background: "rgba(59, 130, 246, 0.15)"}}>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white">AI-Powered Healthcare Workflows</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-8 font-manrope font-medium">
            Your Healthcare
            <br/>
            <span className="text-blue-400 font-manrope font-medium">AI Assistant</span>
          </h1>
          
          <p className="text-xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto font-sans">
            Chat-based interface for building guided healthcare workflows. Get intelligent assistance for everything from patient intake to complex care coordination.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
              <span className="font-sans">Try Assistant</span>
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20" style={{background: "rgba(255, 255, 255, 0.03)"}}>
              <span className="font-sans">Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">95%</div>
            <p className="text-sm text-white/60 font-sans">Query Accuracy</p>
          </div>
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">5x</div>
            <p className="text-sm text-white/60 font-sans">Faster Workflow Creation</p>
          </div>
          <div className="text-center border border-white/10 rounded-2xl p-6" style={{background: "rgba(255, 255, 255, 0.03)"}}>
            <div className="text-3xl text-white mb-2 font-manrope font-medium">24/7</div>
            <p className="text-sm text-white/60 font-sans">Always Available</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div className="relative lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12 overflow-hidden" style={{background: "rgba(59, 130, 246, 0.1)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)"}}>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">Ready to Get Started?</h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-sans">Experience the power of AI-assisted healthcare workflow creation.</p>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
              <span className="font-sans">Try Assistant Now</span>
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
