"""
Example workflows demonstrating the enhanced template engine capabilities.
"""

# Example 1: E-commerce Order Processing
ecommerce_workflow = {
    "name": "E-commerce Order Processing",
    "description": "Process orders with data transformation and email notifications",
    "nodes": [
        {
            "id": "trigger1",
            "type": "trigger",
            "data": {
                "label": "New Order Webhook",
                "triggerType": "webhook"
            }
        },
        {
            "id": "fetch_products",
            "type": "action",
            "data": {
                "label": "Fetch Product Details",
                "connectorId": "http",
                "integrationId": "http_integration",
                "actionId": "get",
                "config": {
                    "url": "https://api.example.com/products",
                    "params": {
                        "ids": "{{join {{pluck ${order.items} 'product_id'}} ','}}"
                    }
                }
            }
        },
        {
            "id": "calculate_totals",
            "type": "transform",
            "data": {
                "label": "Calculate Order Totals",
                "config": {
                    "order_count": "{{length ${order.items}}}",
                    "subtotal": "{{sum {{pluck ${order.items} 'price'}}}}",
                    "tax": "{{round {{sum {{pluck ${order.items} 'price'}}}} * 0.08 2}}",
                    "shipping": "{{if {{length ${order.items}}} > 5 0 9.99}}",
                    "total": "{{round {{sum {{pluck ${order.items} 'price'}}}} * 1.08 + ${shipping} 2}}"
                }
            }
        },
        {
            "id": "send_confirmation",
            "type": "action",
            "data": {
                "label": "Send Order Confirmation",
                "connectorId": "gmail",
                "integrationId": "gmail_integration",
                "actionId": "send_email",
                "config": {
                    "to": "${customer.email}",
                    "subject": "Order ${order.id} Confirmation - ${{round ${node_calculate_totals_result.total} 2}}",
                    "body": """
Dear {{capitalize ${customer.name}}},

Thank you for your order!

Order Details:
Order ID: ${order.id}
Date: {{format_date {{now}} '%B %d, %Y at %I:%M %p'}}

Items ({{length ${order.items}}}):
{{join {{pluck ${order.items} 'name'}} '\n- '}}

Pricing:
Subtotal: ${{round ${node_calculate_totals_result.subtotal} 2}}
Tax (8%): ${{round ${node_calculate_totals_result.tax} 2}}
Shipping: ${{round ${node_calculate_totals_result.shipping} 2}}
------------------------
Total: ${{round ${node_calculate_totals_result.total} 2}}

Expected Delivery: {{format_date ${order.estimated_delivery} '%B %d, %Y'}}

Track your order: https://example.com/orders/${order.id}

Questions? Reply to this email or call (555) 123-4567.

Best regards,
The E-commerce Team
                    """
                }
            }
        },
        {
            "id": "check_inventory",
            "type": "condition",
            "data": {
                "label": "Check Low Inventory",
                "config": {
                    "condition": "{{length {{filter ${node_fetch_products_result.data} 'stock' < 10}}}} > 0"
                }
            }
        },
        {
            "id": "alert_inventory",
            "type": "action",
            "data": {
                "label": "Alert Low Inventory",
                "connectorId": "slack",
                "integrationId": "slack_integration",
                "actionId": "send_message",
                "config": {
                    "channel": "#inventory-alerts",
                    "text": "⚠️ Low Inventory Alert\n\nProducts below threshold:\n{{join {{pluck {{filter ${node_fetch_products_result.data} 'stock' < 10}} 'name'}} '\n- '}}\n\nOrder: ${order.id}"
                }
            }
        }
    ],
    "edges": [
        {"source": "trigger1", "target": "fetch_products"},
        {"source": "fetch_products", "target": "calculate_totals"},
        {"source": "calculate_totals", "target": "send_confirmation"},
        {"source": "send_confirmation", "target": "check_inventory"},
        {"source": "check_inventory", "target": "alert_inventory", "condition": "true"}
    ]
}


# Example 2: Healthcare Patient Follow-up
healthcare_workflow = {
    "name": "Patient Follow-up Automation",
    "description": "Process patient appointments and send personalized follow-ups",
    "nodes": [
        {
            "id": "trigger1",
            "type": "trigger",
            "data": {
                "label": "Daily Appointment Check",
                "triggerType": "scheduled",
                "config": {
                    "schedule": "0 8 * * *"  # Daily at 8 AM
                }
            }
        },
        {
            "id": "fetch_appointments",
            "type": "action",
            "data": {
                "label": "Fetch Today's Completed Appointments",
                "connectorId": "epic",
                "integrationId": "epic_integration",
                "actionId": "search_appointments",
                "config": {
                    "date": "{{format_date {{now}} '%Y-%m-%d'}}",
                    "status": "completed"
                }
            }
        },
        {
            "id": "loop_patients",
            "type": "loop",
            "data": {
                "label": "For Each Patient",
                "config": {
                    "items": "${node_fetch_appointments_result.data.appointments}"
                }
            }
        },
        {
            "id": "fetch_patient_details",
            "type": "action",
            "data": {
                "label": "Get Patient Details",
                "connectorId": "epic",
                "integrationId": "epic_integration",
                "actionId": "get_patient",
                "config": {
                    "patient_id": "${loop_item.patient_id}"
                }
            }
        },
        {
            "id": "get_medications",
            "type": "action",
            "data": {
                "label": "Get Active Medications",
                "connectorId": "epic",
                "integrationId": "epic_integration",
                "actionId": "get_medications",
                "config": {
                    "patient_id": "${loop_item.patient_id}",
                    "status": "active"
                }
            }
        },
        {
            "id": "check_high_risk",
            "type": "condition",
            "data": {
                "label": "Check High-Risk Conditions",
                "config": {
                    "condition": "{{length {{filter ${node_get_medications_result.data} 'risk_level' 'high'}}}} > 0"
                }
            }
        },
        {
            "id": "send_follow_up",
            "type": "action",
            "data": {
                "label": "Send Follow-up Email",
                "connectorId": "gmail",
                "integrationId": "gmail_integration",
                "actionId": "send_email",
                "config": {
                    "to": "${loop_item.patient_email}",
                    "subject": "Follow-up: Your Appointment on {{format_date ${loop_item.appointment_date} '%B %d'}}",
                    "body": """
Dear {{capitalize ${node_fetch_patient_details_result.data.name}}},

Thank you for visiting us on {{format_date ${loop_item.appointment_date} '%B %d, %Y'}}.

Appointment Summary:
Type: ${loop_item.appointment_type}
Provider: Dr. ${loop_item.provider_name}
Duration: {{date_diff ${loop_item.end_time} ${loop_item.start_time} 'minutes'}} minutes

{{if {{length ${node_get_medications_result.data}}} > 0
"Current Medications:
{{join {{pluck ${node_get_medications_result.data} 'name'}} '\n- '}}

Please ensure you take your medications as prescribed."
"No active medications on file."}}

{{if {{length {{filter ${node_get_medications_result.data} 'risk_level' 'high'}}}} > 0
"⚠️ IMPORTANT: You have high-risk medications. Please monitor for side effects and contact us immediately if you experience any unusual symptoms."
""}}

Next Steps:
{{default ${loop_item.next_steps} "Continue with your current care plan."}}

Need a Refill?
Call us at (555) 123-4567 or use our patient portal.

Questions or Concerns?
Reply to this email or call our office.

Your Care Team
Medical Practice Name
                    """
                }
            }
        },
        {
            "id": "alert_provider",
            "type": "action",
            "data": {
                "label": "Alert Provider - High Risk",
                "connectorId": "slack",
                "integrationId": "slack_integration",
                "actionId": "send_message",
                "config": {
                    "channel": "#provider-alerts",
                    "text": """
🏥 High-Risk Patient Follow-up Required

Patient: {{uppercase ${node_fetch_patient_details_result.data.name}}}
ID: ${loop_item.patient_id}
Last Visit: {{format_date ${loop_item.appointment_date} '%B %d, %Y'}}

High-Risk Medications ({{length {{filter ${node_get_medications_result.data} 'risk_level' 'high'}}}}):
{{join {{pluck {{filter ${node_get_medications_result.data} 'risk_level' 'high'}} 'name'}} '\n- '}}

Provider: Dr. ${loop_item.provider_name}

Action: Schedule follow-up call within 48 hours
                    """
                }
            }
        }
    ],
    "edges": [
        {"source": "trigger1", "target": "fetch_appointments"},
        {"source": "fetch_appointments", "target": "loop_patients"},
        {"source": "loop_patients", "target": "fetch_patient_details"},
        {"source": "fetch_patient_details", "target": "get_medications"},
        {"source": "get_medications", "target": "check_high_risk"},
        {"source": "check_high_risk", "target": "send_follow_up"},
        {"source": "check_high_risk", "target": "alert_provider", "condition": "true"}
    ]
}


# Example 3: Research Data Aggregation
research_workflow = {
    "name": "Medical Research Data Aggregation",
    "description": "Aggregate and analyze research data from multiple sources",
    "nodes": [
        {
            "id": "trigger1",
            "type": "trigger",
            "data": {
                "label": "Manual Research Query",
                "triggerType": "manual"
            }
        },
        {
            "id": "search_pubmed",
            "type": "action",
            "data": {
                "label": "Search PubMed",
                "connectorId": "pubmed",
                "integrationId": "pubmed_integration",
                "actionId": "search",
                "config": {
                    "query": "${research_query}",
                    "max_results": 50
                }
            }
        },
        {
            "id": "search_clinical_trials",
            "type": "action",
            "data": {
                "label": "Search ClinicalTrials.gov",
                "connectorId": "clinicaltrials",
                "integrationId": "ct_integration",
                "actionId": "search",
                "config": {
                    "query": "${research_query}",
                    "recruiting": true
                }
            }
        },
        {
            "id": "aggregate_data",
            "type": "transform",
            "data": {
                "label": "Aggregate Research Data",
                "config": {
                    "total_papers": "{{length ${node_search_pubmed_result.data.articles}}}",
                    "total_trials": "{{length ${node_search_clinical_trials_result.data.studies}}}",
                    "recent_papers": "{{length {{filter ${node_search_pubmed_result.data.articles} 'year' >= 2023}}}}",
                    "active_trials": "{{length {{filter ${node_search_clinical_trials_result.data.studies} 'status' 'Recruiting'}}}}",

                    # Extract key data
                    "paper_titles": "{{pluck ${node_search_pubmed_result.data.articles} 'title'}}",
                    "paper_authors": "{{pluck ${node_search_pubmed_result.data.articles} 'authors'}}",
                    "trial_sponsors": "{{unique {{flatten {{pluck ${node_search_clinical_trials_result.data.studies} 'sponsors'}}}}}}",

                    # Top authors (simplified - would need more complex grouping)
                    "unique_journals": "{{length {{unique {{pluck ${node_search_pubmed_result.data.articles} 'journal'}}}}}}",

                    # Date ranges
                    "oldest_paper": "{{format_date {{min {{pluck ${node_search_pubmed_result.data.articles} 'date'}}}} '%Y'}}",
                    "newest_paper": "{{format_date {{max {{pluck ${node_search_pubmed_result.data.articles} 'date'}}}} '%Y'}}",
                }
            }
        },
        {
            "id": "generate_summary",
            "type": "action",
            "data": {
                "label": "Generate AI Summary",
                "connectorId": "openai",
                "integrationId": "openai_integration",
                "actionId": "chat",
                "config": {
                    "model": "gpt-4",
                    "messages": [
                        {
                            "role": "user",
                            "content": """
Analyze the following medical research data and provide a comprehensive summary:

Search Query: ${research_query}

PubMed Results:
- Total Papers: {{length ${node_search_pubmed_result.data.articles}}}
- Recent Papers (2023+): {{length {{filter ${node_search_pubmed_result.data.articles} 'year' >= 2023}}}}
- Date Range: ${node_aggregate_data_result.oldest_paper} - ${node_aggregate_data_result.newest_paper}
- Journals: ${node_aggregate_data_result.unique_journals} unique

Top Papers:
{{join {{pluck {{slice ${node_search_pubmed_result.data.articles} 0 10}} 'title'}} '\n- '}}

ClinicalTrials.gov Results:
- Total Studies: {{length ${node_search_clinical_trials_result.data.studies}}}
- Currently Recruiting: {{length {{filter ${node_search_clinical_trials_result.data.studies} 'status' 'Recruiting'}}}}

Active Trials:
{{join {{pluck {{filter ${node_search_clinical_trials_result.data.studies} 'status' 'Recruiting'}} 'title'}} '\n- '}}

Please provide:
1. Key findings and trends
2. Notable research institutions
3. Clinical implications
4. Gaps in current research
5. Recommendations for further investigation
                            """
                        }
                    ]
                }
            }
        },
        {
            "id": "send_report",
            "type": "action",
            "data": {
                "label": "Email Research Report",
                "connectorId": "gmail",
                "integrationId": "gmail_integration",
                "actionId": "send_email",
                "config": {
                    "to": "${researcher_email}",
                    "subject": "Research Summary: ${research_query} ({{format_date {{now}} '%B %d, %Y'}})",
                    "body": """
Medical Research Summary Report

Query: ${research_query}
Generated: {{format_date {{now}} '%B %d, %Y at %I:%M %p'}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 STATISTICS

PubMed Articles:
• Total Papers: {{length ${node_search_pubmed_result.data.articles}}}
• Recent (2023+): {{length {{filter ${node_search_pubmed_result.data.articles} 'year' >= 2023}}}} ({{round {{length {{filter ${node_search_pubmed_result.data.articles} 'year' >= 2023}}}} / {{length ${node_search_pubmed_result.data.articles}}} * 100 1}}%)
• Date Range: ${node_aggregate_data_result.oldest_paper} - ${node_aggregate_data_result.newest_paper}
• Unique Journals: ${node_aggregate_data_result.unique_journals}

Clinical Trials:
• Total Studies: {{length ${node_search_clinical_trials_result.data.studies}}}
• Currently Recruiting: {{length {{filter ${node_search_clinical_trials_result.data.studies} 'status' 'Recruiting'}}}}
• Unique Sponsors: {{length ${node_aggregate_data_result.trial_sponsors}}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 AI ANALYSIS

${node_generate_summary_result.data.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📑 TOP RECENT PAPERS

{{join {{pluck {{slice {{sort {{filter ${node_search_pubmed_result.data.articles} 'year' >= 2023}} 'date' true}} 0 5}} 'title'}} '\n\n'}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 ACTIVE CLINICAL TRIALS

{{join {{pluck {{slice {{filter ${node_search_clinical_trials_result.data.studies} 'status' 'Recruiting'}} 0 5}} 'title'}} '\n\n'}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For detailed results, access:
PubMed: https://pubmed.ncbi.nlm.nih.gov/?term=${research_query}
ClinicalTrials: https://clinicaltrials.gov/search?term=${research_query}

Questions? Contact the Research Team
                    """
                }
            }
        }
    ],
    "edges": [
        {"source": "trigger1", "target": "search_pubmed"},
        {"source": "trigger1", "target": "search_clinical_trials"},
        {"source": "search_pubmed", "target": "aggregate_data"},
        {"source": "search_clinical_trials", "target": "aggregate_data"},
        {"source": "aggregate_data", "target": "generate_summary"},
        {"source": "generate_summary", "target": "send_report"}
    ]
}


# Example 4: Data Quality Check
data_quality_workflow = {
    "name": "Data Quality Validation",
    "description": "Validate and report on data quality issues",
    "nodes": [
        {
            "id": "trigger1",
            "type": "trigger",
            "data": {
                "label": "Scheduled Quality Check",
                "triggerType": "scheduled",
                "config": {
                    "schedule": "0 0 * * 0"  # Weekly on Sunday
                }
            }
        },
        {
            "id": "fetch_data",
            "type": "action",
            "data": {
                "label": "Fetch Patient Records",
                "connectorId": "http",
                "integrationId": "http_integration",
                "actionId": "get",
                "config": {
                    "url": "https://api.example.com/patients"
                }
            }
        },
        {
            "id": "validate_data",
            "type": "transform",
            "data": {
                "label": "Run Data Quality Checks",
                "config": {
                    # Count records
                    "total_records": "{{length ${node_fetch_data_result.data}}}",

                    # Check for missing required fields
                    "missing_email": "{{length {{filter ${node_fetch_data_result.data} 'email' null}}}}",
                    "missing_phone": "{{length {{filter ${node_fetch_data_result.data} 'phone' null}}}}",
                    "missing_dob": "{{length {{filter ${node_fetch_data_result.data} 'date_of_birth' null}}}}",

                    # Calculate percentages
                    "email_completeness": "{{round ({{length ${node_fetch_data_result.data}}} - {{length {{filter ${node_fetch_data_result.data} 'email' null}}}}) / {{length ${node_fetch_data_result.data}}} * 100 1}}",
                    "phone_completeness": "{{round ({{length ${node_fetch_data_result.data}}} - {{length {{filter ${node_fetch_data_result.data} 'phone' null}}}}) / {{length ${node_fetch_data_result.data}}} * 100 1}}",

                    # Find duplicates (simplified)
                    "unique_emails": "{{length {{unique {{pluck ${node_fetch_data_result.data} 'email'}}}}}}",
                    "potential_duplicates": "{{length ${node_fetch_data_result.data}}} - {{length {{unique {{pluck ${node_fetch_data_result.data} 'email'}}}}}}",

                    # Quality score
                    "quality_score": "{{round (${email_completeness} + ${phone_completeness}) / 2 1}}"
                }
            }
        },
        {
            "id": "check_quality",
            "type": "condition",
            "data": {
                "label": "Check if Issues Found",
                "config": {
                    "condition": "${node_validate_data_result.quality_score} < 95"
                }
            }
        },
        {
            "id": "send_alert",
            "type": "action",
            "data": {
                "label": "Send Quality Alert",
                "connectorId": "slack",
                "integrationId": "slack_integration",
                "actionId": "send_message",
                "config": {
                    "channel": "#data-quality",
                    "text": """
🔍 Data Quality Report - {{format_date {{now}} '%B %d, %Y'}}

Total Records: {{length ${node_fetch_data_result.data}}}

Quality Score: ${node_validate_data_result.quality_score}% {{if ${node_validate_data_result.quality_score} >= 95 '✅' '⚠️'}}

Completeness:
• Email: ${node_validate_data_result.email_completeness}% ({{length ${node_fetch_data_result.data}}} - ${node_validate_data_result.missing_email} missing)
• Phone: ${node_validate_data_result.phone_completeness}% ({{length ${node_fetch_data_result.data}}} - ${node_validate_data_result.missing_phone} missing)
• DOB: Missing ${node_validate_data_result.missing_dob} records

Duplicates:
• Potential duplicates: ${node_validate_data_result.potential_duplicates}

{{if ${node_validate_data_result.quality_score} < 90
"⚠️ CRITICAL: Quality score below 90%. Immediate action required!"
"ℹ️ Action needed to improve data quality."}}

Review Dashboard: https://dashboard.example.com/data-quality
                    """
                }
            }
        }
    ],
    "edges": [
        {"source": "trigger1", "target": "fetch_data"},
        {"source": "fetch_data", "target": "validate_data"},
        {"source": "validate_data", "target": "check_quality"},
        {"source": "check_quality", "target": "send_alert", "condition": "true"}
    ]
}


# Export all examples
WORKFLOW_EXAMPLES = {
    "ecommerce_order_processing": ecommerce_workflow,
    "healthcare_patient_followup": healthcare_workflow,
    "research_data_aggregation": research_workflow,
    "data_quality_validation": data_quality_workflow,
}


if __name__ == "__main__":
    import json

    print("=" * 80)
    print("WORKFLOW TEMPLATE ENGINE EXAMPLES")
    print("=" * 80)

    for name, workflow in WORKFLOW_EXAMPLES.items():
        print(f"\n{name.upper().replace('_', ' ')}")
        print("-" * 80)
        print(f"Name: {workflow['name']}")
        print(f"Description: {workflow['description']}")
        print(f"Nodes: {len(workflow['nodes'])}")
        print(f"Edges: {len(workflow['edges'])}")

        # Count template features used
        workflow_str = json.dumps(workflow)
        template_count = workflow_str.count('${')
        helper_count = workflow_str.count('{{')

        print(f"Template Variables: {template_count}")
        print(f"Helper Functions: {helper_count}")

        print("\nKey Features:")
        if 'pluck' in workflow_str:
            print("  • Array extraction (pluck)")
        if 'filter' in workflow_str:
            print("  • Array filtering")
        if 'format_date' in workflow_str:
            print("  • Date formatting")
        if 'join' in workflow_str:
            print("  • Array joining")
        if 'round' in workflow_str:
            print("  • Math operations")
        if 'if' in workflow_str:
            print("  • Conditional logic")

    print("\n" + "=" * 80)
    print("See backend/docs/template-engine-guide.md for full documentation")
    print("=" * 80)
