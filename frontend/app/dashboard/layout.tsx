import type { ReactNode } from "react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default function DashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-[#0A0B14] text-white">
			<aside className="hidden w-64 shrink-0 border-r border-white/10 lg:block">
				<SidebarNav />
			</aside>
			<div className="flex-1 px-6lg:px-10">
				<main>{children}</main>
			</div>
		</div>
	);
}
