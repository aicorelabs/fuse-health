import { Bot, Clock3, Database, FileText, Filter, Mail, MessageSquare, Repeat, Sparkles, Table } from "lucide-react";
import { FlowDefinition, NodeTemplate } from "../page";
import { Position } from "reactflow";



export const nodeTemplates: NodeTemplate[] = [
    {
        id: "schedule",
        label: "Schedule Trigger",
        subtitle: "Time-based",
        category: "trigger",
        accent: "violet",
        icon: Clock3,
        chipText: "Trigger",
        description: "Run workflow on a schedule",
        defaultConfig: {
            cadence: "Daily",
            time: "09:00 AM",
        },
        configFields: [
            {
                id: "cadence",
                label: "Cadence",
                type: "text",
                required: true,
                placeholder: "Daily",
            },
            { id: "time", label: "Time", type: "text", placeholder: "09:00 AM" },
        ],
    },
    {
        id: "event-trigger",
        label: "Event Trigger",
        subtitle: "Epic/EHR event",
        category: "trigger",
        accent: "blue",
        icon: Database,
        chipText: "Trigger",
        description: "Start on EHR data event",
        defaultConfig: {
            event: "Observation.create",
        },
        configFields: [
            { id: "event", label: "Event Type", type: "text", required: true },
            { id: "facility", label: "Facility", type: "text" },
        ],
    },
    {
        id: "google-sheets",
        label: "Google Sheets",
        subtitle: "Read/write rows",
        category: "data",
        accent: "green",
        icon: Table,
        chipText: "Data",
        description: "Fetch or update spreadsheet data",
        defaultConfig: {
            sheetUrl: "",
            worksheet: "Sheet1",
            range: "A:Z",
        },
        configFields: [
            {
                id: "sheetUrl",
                label: "Sheet URL",
                type: "text",
                required: true,
                placeholder: "https://docs.google.com/...",
            },
            { id: "worksheet", label: "Worksheet", type: "text" },
            { id: "range", label: "Range", type: "text" },
        ],
    },
    {
        id: "filter",
        label: "Filter/Branch",
        subtitle: "Conditional logic",
        category: "logic",
        accent: "aqua",
        icon: Filter,
        chipText: "Logic",
        description: "Route based on conditions",
        defaultConfig: {
            expression: "",
        },
        configFields: [
            {
                id: "expression",
                label: "Condition",
                type: "text",
                required: true,
                placeholder: "value > 100",
            },
        ],
    },
    {
        id: "loop",
        label: "Loop Iterator",
        subtitle: "For each item",
        category: "logic",
        accent: "aqua",
        icon: Repeat,
        chipText: "Logic",
        description: "Iterate over collection",
        defaultConfig: {
            iterator: "items",
            concurrency: "Sequential",
        },
        configFields: [
            { id: "iterator", label: "Iterator", type: "text", placeholder: "items" },
            {
                id: "concurrency",
                label: "Concurrency",
                type: "text",
                placeholder: "Sequential",
            },
        ],
    },
    {
        id: "text-ai",
        label: "Text AI",
        subtitle: "GPT/Claude",
        category: "ai",
        accent: "pink",
        icon: Sparkles,
        chipText: "AI Agent",
        description: "Generate text with LLM",
        defaultConfig: {
            prompt: "",
            temperature: "0.7",
        },
        configFields: [
            {
                id: "prompt",
                label: "Prompt",
                type: "textarea",
                required: true,
                placeholder: "Write instructions...",
            },
            {
                id: "temperature",
                label: "Temperature",
                type: "text",
                placeholder: "0.7",
            },
        ],
    },
    {
        id: "ai-assistant",
        label: "AI Assistant",
        subtitle: "Multi-step agent",
        category: "ai",
        accent: "violet",
        icon: Bot,
        chipText: "AI Agent",
        description: "Run autonomous AI agent",
        defaultConfig: {
            instructions: "",
        },
        configFields: [
            {
                id: "instructions",
                label: "Instructions",
                type: "textarea",
                required: true,
                placeholder: "Describe the agent's task...",
            },
        ],
    },
    {
        id: "gmail",
        label: "Gmail",
        subtitle: "Send email",
        category: "action",
        accent: "red",
        icon: Mail,
        chipText: "Action",
        description: "Send emails via Gmail",
        defaultConfig: {
            to: "",
            subject: "",
            body: "",
        },
        configFields: [
            {
                id: "to",
                label: "To",
                type: "email",
                required: true,
                placeholder: "recipient@example.com",
            },
            { id: "subject", label: "Subject", type: "text", required: true },
            {
                id: "body",
                label: "Body",
                type: "textarea",
                placeholder: "Email content...",
            },
        ],
        requiresConnectorSelection: true,
    },
    {
        id: "notification",
        label: "Send Notification",
        subtitle: "SMS/PagerDuty",
        category: "action",
        accent: "pink",
        icon: MessageSquare,
        chipText: "Action",
        description: "Alert via SMS or pager",
        defaultConfig: {
            channel: "SMS",
            message: "",
        },
        configFields: [
            { id: "channel", label: "Channel", type: "text", required: true },
            {
                id: "message",
                label: "Message",
                type: "textarea",
                required: true,
                placeholder: "Alert message...",
            },
        ],
    },
    {
        id: "epic-write",
        label: "Write to Epic",
        subtitle: "Update EHR",
        category: "action",
        accent: "blue",
        icon: FileText,
        chipText: "Action",
        description: "Create/update Epic record",
        defaultConfig: {
            resource: "",
            data: "",
        },
        configFields: [
            {
                id: "resource",
                label: "Resource Type",
                type: "text",
                required: true,
                placeholder: "Observation",
            },
            {
                id: "data",
                label: "Data",
                type: "textarea",
                required: true,
                placeholder: "JSON payload...",
            },
        ],
    },
];

export const initialFlows: FlowDefinition[] = [
    {
        id: "flow-upsell",
        name: "Automate Sending Upsell Offers",
        category: "Care navigation",
        summary:
            "Review weekly patient cohorts, craft contextual upsell messaging, and deliver through Gmail.",
        cadence: "Every week on Monday 08:00",
        status: "draft",
        lastDeployed: "Never",
        nodes: [
            {
                id: "schedule",
                type: "step",
                position: { x: 50, y: 250 },
                data: {
                    label: "Every Week",
                    subtitle: "Schedule",
                    accent: "violet",
                    icon: Clock3,
                    chipText: "Trigger",
                    connectors: [
                        {
                            id: "schedule-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        cadence: "Weekly",
                        day: "Monday",
                        time: "08:00 AM",
                    },
                    configFields: [
                        {
                            id: "cadence",
                            label: "Cadence",
                            type: "text",
                            required: true,
                            placeholder: "Weekly",
                        },
                        { id: "day", label: "Day", type: "text", placeholder: "Monday" },
                        {
                            id: "time",
                            label: "Time",
                            type: "text",
                            placeholder: "08:00 AM",
                        },
                    ],
                },
            },
            {
                id: "sheet",
                type: "step",
                position: { x: 300, y: 250 },
                data: {
                    label: "Get next row(s)",
                    subtitle: "Google Sheets",
                    accent: "green",
                    icon: Table,
                    chipText: "Data",
                    helperText: "Use filter to fetch only new opportunities",
                    connectors: [
                        {
                            id: "sheet-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "sheet-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        sheetUrl: "https://docs.google.com/spreadsheets/...",
                        worksheet: "Upsell Opportunities",
                        range: "A:E",
                    },
                    configFields: [
                        {
                            id: "sheetUrl",
                            label: "Sheet URL",
                            type: "text",
                            required: true,
                            placeholder: "https://docs.google.com/...",
                        },
                        {
                            id: "worksheet",
                            label: "Worksheet",
                            type: "text",
                            placeholder: "Upsell Opportunities",
                        },
                        {
                            id: "range",
                            label: "Range",
                            type: "text",
                            placeholder: "A:E",
                        },
                    ],
                },
            },
            {
                id: "loop",
                type: "step",
                position: { x: 550, y: 250 },
                data: {
                    label: "Loop on Items",
                    subtitle: "For each patient",
                    accent: "aqua",
                    icon: Repeat,
                    chipText: "Logic",
                    connectors: [
                        {
                            id: "loop-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "loop-iterate",
                            type: "source",
                            position: Position.Bottom,
                            style: { left: "50%" },
                        },
                        {
                            id: "loop-complete",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        iterator: "rows",
                        concurrency: "Sequential",
                    },
                    configFields: [
                        {
                            id: "iterator",
                            label: "Iterator",
                            type: "text",
                            placeholder: "rows",
                        },
                        {
                            id: "concurrency",
                            label: "Concurrency",
                            type: "text",
                            placeholder: "Sequential",
                        },
                    ],
                },
            },
            {
                id: "ai",
                type: "step",
                position: { x: 550, y: 420 },
                data: {
                    label: "Ask AI",
                    subtitle: "Text AI",
                    accent: "pink",
                    icon: Sparkles,
                    chipText: "Agent",
                    helperText: "Use clinical tone guidelines for messaging",
                    connectors: [
                        {
                            id: "ai-in",
                            type: "target",
                            position: Position.Top,
                            style: { left: "50%" },
                        },
                        {
                            id: "ai-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        prompt:
                            "Craft an upsell email for the patient using the supplied fields and follow the tone guide.",
                        temperature: "0.4",
                    },
                    configFields: [
                        {
                            id: "prompt",
                            label: "Prompt",
                            type: "textarea",
                            required: true,
                            placeholder: "Write an email explaining...",
                        },
                        {
                            id: "temperature",
                            label: "Creativity",
                            type: "text",
                            placeholder: "0.4",
                        },
                    ],
                },
            },
            {
                id: "email",
                type: "step",
                position: { x: 800, y: 250 },
                data: {
                    label: "Send Email",
                    subtitle: "Gmail",
                    accent: "red",
                    icon: Mail,
                    status: "attention",
                    helperText: "Connect Gmail and map fields before publishing",
                    chipText: "Action",
                    connectors: [
                        {
                            id: "email-in-loop",
                            type: "target",
                            position: Position.Left,
                            style: { top: "50%" },
                        },
                        {
                            id: "email-in-content",
                            type: "target",
                            position: Position.Bottom,
                        },
                        {
                            id: "email-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        connection: "",
                        to: "",
                        cc: "",
                        bcc: "",
                        subject: "",
                    },
                    configFields: [
                        {
                            id: "connection",
                            label: "Connection",
                            type: "text",
                            required: true,
                            placeholder: "Select Gmail connection",
                        },
                        {
                            id: "to",
                            label: "Receiver Email (To)",
                            type: "email",
                            required: true,
                        },
                        { id: "cc", label: "CC Email", type: "multi" },
                        { id: "bcc", label: "BCC Email", type: "multi" },
                        { id: "subject", label: "Subject", type: "text", required: true },
                    ],
                },
            },
        ],
        edges: [
            {
                id: "schedule-sheet",
                source: "schedule",
                sourceHandle: "schedule-out",
                target: "sheet",
                targetHandle: "sheet-in",
                type: "smoothstep",
            },
            {
                id: "sheet-loop",
                source: "sheet",
                sourceHandle: "sheet-out",
                target: "loop",
                targetHandle: "loop-in",
                type: "smoothstep",
            },
            {
                id: "loop-ai",
                source: "loop",
                sourceHandle: "loop-iterate",
                target: "ai",
                targetHandle: "ai-in",
                type: "smoothstep",
            },
            {
                id: "loop-email",
                source: "loop",
                sourceHandle: "loop-complete",
                target: "email",
                targetHandle: "email-in-loop",
                type: "smoothstep",
            },
            {
                id: "ai-email",
                source: "ai",
                sourceHandle: "ai-out",
                target: "email",
                targetHandle: "email-in-content",
                type: "smoothstep",
            },
        ],
    },
    {
        id: "flow-critical-labs",
        name: "Escalate Critical Lab Results",
        category: "Clinical safety",
        summary:
            "Detect critical lab values, alert the covering provider, and document the intervention.",
        cadence: "Runs continuously on lab events",
        status: "published",
        lastDeployed: "2025-08-24 11:14",
        nodes: [
            {
                id: "trigger-lab",
                type: "step",
                position: { x: 50, y: 250 },
                data: {
                    label: "On Lab Result",
                    subtitle: "Epic event",
                    accent: "blue",
                    icon: Database,
                    chipText: "Trigger",
                    connectors: [
                        {
                            id: "trigger-lab-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        event: "Observation.create",
                        facility: "Emergency",
                    },
                    configFields: [
                        { id: "event", label: "Event", type: "text", required: true },
                        { id: "facility", label: "Facility", type: "text" },
                    ],
                },
            },
            {
                id: "filter-critical",
                type: "step",
                position: { x: 300, y: 250 },
                data: {
                    label: "Filter critical values",
                    subtitle: "Threshold > limit",
                    accent: "aqua",
                    icon: Filter,
                    chipText: "Logic",
                    connectors: [
                        {
                            id: "filter-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "filter-true",
                            type: "source",
                            position: Position.Right,
                            style: { top: "50%" },
                        },
                        {
                            id: "filter-false",
                            type: "source",
                            position: Position.Top,
                            label: "Else",
                            style: { left: "50%" },
                        },
                    ],
                    config: {
                        expression: "result.flag === 'critical'",
                    },
                    configFields: [
                        {
                            id: "expression",
                            label: "Filter expression",
                            type: "text",
                            placeholder: "result.flag === 'critical'",
                        },
                    ],
                },
            },
            {
                id: "notify",
                type: "step",
                position: { x: 550, y: 250 },
                data: {
                    label: "Notify covering provider",
                    subtitle: "PagerDuty + SMS",
                    accent: "pink",
                    icon: MessageSquare,
                    chipText: "Action",
                    connectors: [
                        {
                            id: "notify-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "notify-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        channel: "On-call SMS",
                        fallback: "PagerDuty escalation",
                    },
                    configFields: [
                        { id: "channel", label: "Primary Channel", type: "text" },
                        { id: "fallback", label: "Fallback", type: "text" },
                    ],
                },
            },
            {
                id: "ai-note",
                type: "step",
                position: { x: 800, y: 250 },
                data: {
                    label: "Draft clinical note",
                    subtitle: "AI summarization",
                    accent: "violet",
                    icon: Bot,
                    chipText: "Agent",
                    connectors: [
                        {
                            id: "ai-note-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "ai-note-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        template: "Document alert, response, and patient outreach",
                    },
                    configFields: [
                        { id: "template", label: "Template", type: "textarea" },
                    ],
                },
            },
            {
                id: "file",
                type: "step",
                position: { x: 1050, y: 250 },
                data: {
                    label: "Attach to chart",
                    subtitle: "Epic SmartDoc",
                    accent: "green",
                    icon: FileText,
                    status: "complete",
                    chipText: "Action",
                    connectors: [
                        {
                            id: "file-in",
                            type: "target",
                            position: Position.Left,
                        },
                        {
                            id: "file-out",
                            type: "source",
                            position: Position.Right,
                        },
                    ],
                    config: {
                        encounterType: "ED Follow-up",
                    },
                    configFields: [
                        { id: "encounterType", label: "Encounter Type", type: "text" },
                    ],
                },
            },
        ],
        edges: [
            {
                id: "lab-filter",
                source: "trigger-lab",
                sourceHandle: "trigger-lab-out",
                target: "filter-critical",
                targetHandle: "filter-in",
                type: "smoothstep",
            },
            {
                id: "filter-notify",
                source: "filter-critical",
                sourceHandle: "filter-true",
                target: "notify",
                targetHandle: "notify-in",
                type: "smoothstep",
            },
            {
                id: "notify-note",
                source: "notify",
                sourceHandle: "notify-out",
                target: "ai-note",
                targetHandle: "ai-note-in",
                type: "smoothstep",
            },
            {
                id: "note-file",
                source: "ai-note",
                sourceHandle: "ai-note-out",
                target: "file",
                targetHandle: "file-in",
                type: "smoothstep",
            },
        ],
    },
];