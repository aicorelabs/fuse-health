import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const metrics = [
	{
		label: "Active MCPs",
		value: "12",
		delta: "+2.4%",
	},
	{
		label: "Avg. response latency",
		value: "613 ms",
		delta: "-8.2%",
	},
	{
		label: "Messages processed",
		value: "48,921",
		delta: "+12.5%",
	},
];

export default function DashboardPage() {
	return (
		<div className="space-y-10">
			<section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<div className="space-y-3">
					<h2 className="text-2xl font-semibold text-white">
						Welcome back, Operator
					</h2>
					<p className="max-w-xl text-sm text-white/60">
						Keep a pulse on every MCP across your enterprise stack. Follow live
						sessions, monitor performance, and surface compliance signals in one
						place.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button variant="outline" className="border-white/20">
						Download audit log
					</Button>
					<Button>Launch new MCP</Button>
				</div>
			</section>

			<section className="grid gap-6 md:grid-cols-3">
				{metrics.map((metric) => (
					<Card key={metric.label} className="relative overflow-hidden">
						<CardHeader>
							<CardDescription>{metric.label}</CardDescription>
							<CardTitle className="text-3xl font-semibold">
								{metric.value}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-emerald-400/80">{metric.delta} vs last week</p>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
				<Card>
					<CardHeader>
						<CardTitle>Live sessions</CardTitle>
						<CardDescription>
							Follow active conversations and intervene when necessary.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{[
							{
								id: "session-341",
								agent: "Prior Authorization",
								owner: "Cerner",
								latency: "480 ms",
							},
							{
								id: "session-338",
								agent: "Eligibility",
								owner: "Epic FHIR",
								latency: "712 ms",
							},
							{
								id: "session-336",
								agent: "Care Plan Uplift",
								owner: "Athena",
								latency: "533 ms",
							},
						].map((session) => (
							<div
								key={session.id}
												className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
							>
								<div>
									<p className="text-sm font-medium text-white">
										{session.agent}
									</p>
									<p className="text-xs text-white/55">
										{session.owner}
									</p>
								</div>
								<div className="text-right">
									<p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
										Stable
									</p>
									<p className="text-sm text-white/70">{session.latency}</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Compliance feed</CardTitle>
						<CardDescription>
							Most recent policy events and audit checkpoints.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{["SOC2 drift scan", "HIPAA logging", "PHI scrubber"].map(
							(item, index) => (
								<div
									key={item}
											className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
								>
									<div>
										<p className="text-sm font-medium text-white">{item}</p>
										<p className="text-xs text-white/55">Updated 2h ago</p>
									</div>
									<span className="text-xs uppercase tracking-[0.2em] text-white/50">
										#{index + 1}
									</span>
								</div>
							)
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
