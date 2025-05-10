"use client"
import * as React from "react"
import {
  Users,
  GraduationCap,
  LayoutGrid,
  DollarSign,
  Settings2,
  Home,
  LineChart,
  FileText,
  Bell,
  User,
  LogOut,
  PenIcon,
  BadgeDollarSign,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Education Management System data structure
const data = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/avatars/admin-avatar.jpg",
  },
  teams: [
    {
      name: "CSEDU PMICS Portal",
      logo: GraduationCap,
      plan: "Educational",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/protected",
      icon: Home,
      isActive: true,
    },
    {
      title: "Teachers",
      url: "/protected/teachers",
      icon: Users,
      items: [
        {
          title: "All Teachers",
          url: "/protected/teachers",
        },
        {
          title: "Add Teacher",
          url: "/protected/teachers/add",
        },
        {
          title: "Attendance",
          url: "/protected/teachers/attendance",
        },
      ],
    },
    {
      title: "Batches",
      url: "/protected/batch",
      icon: LayoutGrid,
      items: [
        {
          title: "Manage Batches",
          url: "/protected/batch",
        },
        {
          title: "Add Batch",
          url: "/protected/batch#addBatchForm",
        },
        {
          title: "Batch Reports",
          url: "/protected/batch/reports",
        },
      ],
    },
    {
      title: "Courses",
      url: "/protected/course",
      icon: GraduationCap,
      items: [
        {
          title: "All Courses",
          url: "/protected/course",
        },
        {
          title: "Add Course",
          url: "/protected/course/add",
        },
        {
          title: "Course Materials",
          url: "/protected/course/materials",
        },
      ],
    },
    {
      title: "Exams",
      url: "/protected/exam",
      icon: PenIcon,
      items: [
        {
          title: "Manage Exams",
          url: "/protected/exam",
        },
        {
          title: "Add Exam",
          url: "/protected/batch#addExamform",
        }
      ],
    },
    {
      title: "Fess",
      url: "/protected/fess",
      icon: BadgeDollarSign,
      items: [
        {
          title: "All Type of Fees",
          url: "/protected/fees",
        },
        {
          title: "Fee Collection",
          url: "/protected/fees/collection",
        },
      ],
    },
    {
      title: "Financials",
      url: "/protected/financials",
      icon: DollarSign,
      items: [
        {
          title: "Overview",
          url: "/protected/financials",
        },
        {
          title: "Transactions",
          url: "/protected/financials/transactions",
        },
        {
          title: "Reports",
          url: "/protected/financials/reports",
        },
        {
          title: "Invoices",
          url: "/protected/financials/invoices",
        },
      ],
    },
    {
      title: "Reports",
      url: "/protected/reports",
      icon: LineChart,
    },
    {
      title: "Settings",
      url: "/protected/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/protected/settings/general",
        },
        {
          title: "Account",
          url: "/protected/settings/account",
        },
        {
          title: "Notifications",
          url: "/protected/settings/notifications",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Quick Links",
      url: "#",
      icon: FileText,
    },
    {
      name: "Notifications",
      url: "/protected/notifications",
      icon: Bell,
      badge: 3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={data.user} 
          actions={[
            {
              label: "Profile",
              icon: User,
              onClick: () => window.location.href = "/protected/profile",
            },
            {
              label: "Settings",
              icon: Settings2,
              onClick: () => window.location.href = "/protected/settings",
            },
            {
              label: "Sign out",
              icon: LogOut,
              onClick: () => window.location.href = "/sign-out",
            },
          ]}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}