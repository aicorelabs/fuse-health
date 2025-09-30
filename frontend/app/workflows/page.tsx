import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function Workflows() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-blue-500/30 mb-8 font-sans"
            style={{ background: "rgba(59, 130, 246, 0.15)" }}
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white">Compliant Healthcare Automation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] tracking-tight mb-8 font-manrope font-medium">
            Intelligent Healthcare
            <br />
            <span className="text-blue-400 font-manrope font-medium">
              Workflow
            </span>{" "}
            Orchestration
          </h1>

          <p className="text-xl text-white/60 leading-relaxed mb-12 max-w-3xl mx-auto font-sans">
            Build compliant, deterministic workflows that connect multiple
            healthcare systems. Our human-in-the-loop orchestration ensures
            safety while automating complex care coordination.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
              <span className="font-sans">Try Workflow Builder</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 stroke-[1.5] ml-2"
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
            <button
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20"
              style={{ background: "rgba(255, 255, 255, 0.03)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 stroke-[1.5] mr-2"
              >
                <polygon points="5,3 19,12 5,21"></polygon>
              </svg>
              <span className="font-sans">Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            className="text-center border border-white/10 rounded-2xl p-6"
            style={{ background: "rgba(255, 255, 255, 0.03)" }}
          >
            <div className="text-3xl text-white mb-2 font-manrope font-medium">
              99.9%
            </div>
            <p className="text-sm text-white/60 font-sans">
              Workflow Success Rate
            </p>
          </div>
          <div
            className="text-center border border-white/10 rounded-2xl p-6"
            style={{ background: "rgba(255, 255, 255, 0.03)" }}
          >
            <div className="text-3xl text-white mb-2 font-manrope font-medium">
              70%
            </div>
            <p className="text-sm text-white/60 font-sans">
              Faster Than Manual
            </p>
          </div>
          <div
            className="text-center border border-white/10 rounded-2xl p-6"
            style={{ background: "rgba(255, 255, 255, 0.03)" }}
          >
            <div className="text-3xl text-white mb-2 font-manrope font-medium">
              100%
            </div>
            <p className="text-sm text-white/60 font-sans">Audit Compliance</p>
          </div>
        </div>
      </section>

      {/* Workflow Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div
          className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">
              Workflows Built for Healthcare
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">
              Unlike generic automation tools, our workflows are designed
              specifically for healthcare's complex requirements, regulatory
              constraints, and safety-critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-2xl text-white mb-6 font-manrope font-medium">
                Human-in-the-Loop Orchestration
              </h3>
              <p className="text-white/60 mb-8 font-sans">
                Our deterministic workflow engine ensures that critical
                healthcare decisions always involve human oversight. No
                autonomous AI making medical choices—just intelligent automation
                that assists professionals.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400 flex-shrink-0"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="text-white/80 font-sans">
                    Approval gates at critical decision points
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400 flex-shrink-0"
                  >
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  <span className="text-white/80 font-sans">
                    Role-based permissions and escalations
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400 flex-shrink-0"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z">
                    </path>
                  </svg>
                  <span className="text-white/80 font-sans">
                    Complete audit trails for compliance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400 flex-shrink-0"
                  >
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z">
                    </path>
                    <path d="M8 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"></path>
                    <path d="M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"></path>
                  </svg>
                  <span className="text-white/80 font-sans">
                    Emergency override capabilities
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/10 overflow-hidden"
              style={{ background: "rgba(255, 255, 255, 0.03)" }}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-white/70 font-sans">
                    Patient Intake Workflow - Step 3 of 5
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10"
                    style={{ background: "rgba(255, 255, 255, 0.02)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm text-white font-sans">
                        Verify Insurance Coverage
                      </span>
                    </div>
                    <span className="text-xs text-green-400 font-sans">
                      Approved
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-4 rounded-xl border border-blue-500/30"
                    style={{ background: "rgba(59, 130, 246, 0.15)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse">
                      </div>
                      <span className="text-sm text-white font-sans">
                        Schedule Fertility Consultation
                      </span>
                    </div>
                    <span className="text-xs text-blue-400 font-sans">
                      Pending Approval
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5"
                    style={{ background: "rgba(255, 255, 255, 0.01)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/30"></div>
                      <span className="text-sm text-white/50 font-sans">
                        Send Referral Documentation
                      </span>
                    </div>
                    <span className="text-xs text-white/40 font-sans">
                      Waiting
                    </span>
                  </div>
                </div>
                <div
                  className="mt-6 p-4 rounded-xl border border-amber-500/30"
                  style={{ background: "rgba(245, 158, 11, 0.15)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-400"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z">
                      </path>
                      <line x1="12" x2="12" y1="9" y2="13"></line>
                      <line x1="12" x2="12.01" y1="17" y2="17"></line>
                    </svg>
                    <span className="text-sm text-amber-400 font-sans">
                      Requires Physician Review
                    </span>
                  </div>
                  <p className="text-xs text-white/70 font-sans">
                    Dr. Smith needs to approve specialist referral before
                    proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div
              className="rounded-2xl border border-white/10 p-8"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30"
                style={{ background: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M9 9h6v6H9z"></path>
                  <path d="m9 1 3 3 3-3"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Visual Workflow Builder
              </h4>
              <p className="text-sm text-white/60 font-sans">
                Drag-and-drop interface for creating complex healthcare
                workflows. No coding required—build visually and deploy
                instantly.
              </p>
            </div>

            <div
              className="rounded-2xl border border-white/10 p-8"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30"
                style={{ background: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3">
                  </path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Template Library
              </h4>
              <p className="text-sm text-white/60 font-sans">
                Pre-built workflows for common healthcare scenarios: patient
                intake, referral management, claims processing, and more.
              </p>
            </div>

            <div
              className="rounded-2xl border border-white/10 p-8"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30"
                style={{ background: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
                  </path>
                  <path d="M13 8H7"></path>
                  <path d="M17 12H7"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Real-time Monitoring
              </h4>
              <p className="text-sm text-white/60 font-sans">
                Track workflow execution in real-time with detailed logs,
                performance metrics, and automated alerts for bottlenecks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div
          className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">
              Common Healthcare Workflows
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">
              From patient intake to discharge planning, our workflows handle
              the complex coordination required in modern healthcare delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Patient Intake */}
            <div
              className="rounded-2xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-green-500/30"
                style={{ background: "rgba(34, 197, 94, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-400"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Patient Intake & Registration
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Automate patient onboarding with insurance verification, medical
                history collection, and appointment scheduling across multiple
                providers.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Insurance eligibility verification
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Medical history aggregation
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Multi-provider scheduling
                  </span>
                </li>
              </ul>
            </div>

            {/* Care Coordination */}
            <div
              className="rounded-2xl border border-blue-500/30 p-8"
              style={{ background: "rgba(59, 130, 246, 0.05)" }}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span
                  className="px-4 py-1 text-xs font-medium text-white rounded-full border border-blue-500/30 font-sans"
                  style={{ background: "rgba(59, 130, 246, 0.15)" }}
                >
                  Most Popular
                </span>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30"
                style={{ background: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <path d="m7 11 2-2-2-2"></path>
                  <path d="M11 13h4"></path>
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Care Coordination
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Orchestrate complex care pathways involving multiple
                specialists, labs, and facilities with automated referral
                management.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Specialist referral routing
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Lab order coordination
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Treatment plan synchronization
                  </span>
                </li>
              </ul>
            </div>

            {/* Claims Processing */}
            <div
              className="rounded-2xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-purple-500/30"
                style={{ background: "rgba(147, 51, 234, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-400"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Claims & Billing
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Automate insurance claims submission, prior authorization
                requests, and payment processing across multiple payers.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Automated claims submission
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Prior authorization workflow
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Denial management
                  </span>
                </li>
              </ul>
            </div>

            {/* Medication Management */}
            <div
              className="rounded-2xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-red-500/30"
                style={{ background: "rgba(239, 68, 68, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M12 8v8"></path>
                  <path d="m8 12 4-4 4 4"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Medication Management
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Coordinate prescription orders, pharmacy fulfillment, and
                medication adherence monitoring across care teams.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    E-prescribing workflows
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Pharmacy coordination
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Adherence monitoring
                  </span>
                </li>
              </ul>
            </div>

            {/* Lab Results */}
            <div
              className="rounded-2xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-amber-500/30"
                style={{ background: "rgba(245, 158, 11, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400"
                >
                  <path d="M9 11H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h5m-5-6a2 2 0 0 1 2-2h3m-3 2v3m3-5v7m3-6V9a2 2 0 0 1 2-2h3m-3 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3m0-5v5" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Lab Results Management
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Automate lab order processing, result delivery, and follow-up
                actions based on critical values and care protocols.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Automated result routing
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Critical value alerts
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Patient notification
                  </span>
                </li>
              </ul>
            </div>

            {/* Discharge Planning */}
            <div
              className="rounded-2xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300"
              style={{ background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/30"
                style={{ background: "rgba(6, 182, 212, 0.15)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-cyan-400"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10,17 15,12 10,7"></polyline>
                  <line x1="15" x2="3" y1="12" y2="12"></line>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-4 font-sans">
                Discharge Planning
              </h4>
              <p className="text-sm text-white/60 mb-6 font-sans">
                Coordinate post-acute care, home health services, and follow-up
                appointments to ensure smooth care transitions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Care transition coordination
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Home health scheduling
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-white/70 font-sans">
                    Follow-up automation
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Builder Demo */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div
          className="lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">
              Visual Workflow Builder
            </h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto font-sans">
              Build complex healthcare workflows visually with our drag-and-drop
              interface. No coding required—just connect the dots.
            </p>
          </div>

          <div
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(0, 0, 0, 0.3)" }}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm text-white/70 font-sans">
                  Patient Referral Workflow
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded font-sans">
                  Save
                </button>
                <button className="px-3 py-1 text-xs bg-green-500 text-white rounded font-sans">
                  Deploy
                </button>
              </div>
            </div>
            <div className="p-8 min-h-[400px] relative">
              {/* Workflow visualization placeholder */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30"
                    style={{ background: "rgba(59, 130, 246, 0.15)" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-400"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                      <path d="M9 9h6v6H9z"></path>
                      <path d="m9 1 3 3 3-3"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg text-white mb-2 font-sans">
                    Interactive Workflow Builder
                  </h4>
                  <p className="text-sm text-white/60 font-sans">
                    Drag and drop healthcare components to build your workflow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl lg:px-8 mr-auto ml-auto pr-6 pl-6 pb-24">
        <div
          className="relative lg:p-16 border-white/10 border rounded-3xl pt-12 pr-12 pb-12 pl-12 overflow-hidden"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl">
          </div>
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl text-white tracking-tight mb-6 font-manrope font-medium">
              Build Your First Healthcare Workflow
            </h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 font-sans">
              Start with our pre-built templates or create custom workflows from
              scratch. Deploy in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all duration-300">
                <span className="font-sans">Try Workflow Builder</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 stroke-[1.5] ml-2"
                >
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
              <button
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl hover:bg-white/5 text-white/80 text-sm font-medium border border-white/10 transition-all duration-300 hover:border-white/20"
                style={{ background: "rgba(255, 255, 255, 0.03)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 stroke-[1.5] mr-2"
                >
                  <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
                <span className="font-sans">Watch Demo</span>
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
              <span className="text-lg font-semibold tracking-tight text-white font-sans">
                Fuse
              </span>
              <p className="text-sm text-white/60 mt-4 font-sans">
                The unified healthcare platform for developers.
              </p>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">
                Platform
              </h6>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/api"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="/workflows"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Workflows
                  </a>
                </li>
                <li>
                  <a
                    href="/assistant"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Assistant
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">
                Resources
              </h6>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/docs"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="/docs"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Tutorials
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    API Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">
                Company
              </h6>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/about"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-semibold text-white mb-4 font-sans">
                Legal
              </h6>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/legal"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/legal"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/legal"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300 font-sans"
                  >
                    HIPAA
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between mt-12 border-t border-white/10 pt-8">
            <p className="text-sm text-white/40 font-sans">
              © 2025 Fuse Health, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z">
                  </path>
                </svg>
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4">
                  </path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z">
                  </path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
