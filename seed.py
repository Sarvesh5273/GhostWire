from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

incidents = [
    {
        "prompt": "Here is our AWS production key AKIAIOSFODNN7EXAMPLE and RDS password db_pass_2024! for the Q2 customer export.",
        "risk_level": "CRITICAL", "confidence_score": 97,
        "categories": ["API_KEY", "PASSWORD", "CUSTOMER_DATA"],
        "decision": "BLOCK",
        "explanation": "Exposed AWS credential and database password with customer data export detected.",
        "compliance_tags": ["SOC2 CC6.1", "GDPR Art. 5", "ISO 27001 A.9", "EU AI Act Art. 52"],
        "blocked": True
    },
    {
        "prompt": "Summarize this contract: CONFIDENTIAL - Master Service Agreement between Acme Corp and TechVentures Ltd, valued at $4.2M annually.",
        "risk_level": "CRITICAL", "confidence_score": 91,
        "categories": ["INTERNAL_DOCS", "FINANCIAL"],
        "decision": "BLOCK",
        "explanation": "Confidential contract with financial terms being sent to external LLM.",
        "compliance_tags": ["GDPR Art. 9", "SOC2 CC6.7", "EU AI Act Art. 52"],
        "blocked": True
    },
    {
        "prompt": "Here is our user database dump: user_id, email, phone, SSN. John Doe, john@acme.com, 555-1234, 123-45-6789",
        "risk_level": "CRITICAL", "confidence_score": 99,
        "categories": ["PII", "CUSTOMER_DATA"],
        "decision": "BLOCK",
        "explanation": "Full PII dataset including SSNs being exposed to public LLM.",
        "compliance_tags": ["GDPR Art. 5", "GDPR Art. 9", "HIPAA 164.312", "EU AI Act Art. 52"],
        "blocked": True
    },
    {
        "prompt": "Review this Python auth module: SECRET_KEY='sk-prod-9xkqL29s' API_TOKEN='Bearer eyJhbGc...' def authenticate(user):",
        "risk_level": "HIGH", "confidence_score": 88,
        "categories": ["SOURCE_CODE", "API_KEY"],
        "decision": "BLOCK",
        "explanation": "Proprietary source code with embedded production secrets detected.",
        "compliance_tags": ["SOC2 CC6.1", "ISO 27001 A.9", "EU AI Act Art. 52"],
        "blocked": True
    },
    {
        "prompt": "Analyze our Q3 revenue breakdown: Product A $2.1M, Product B $890K, Total EBITDA $1.4M. Compare to competitor estimates.",
        "risk_level": "HIGH", "confidence_score": 82,
        "categories": ["FINANCIAL", "INTERNAL_DOCS"],
        "decision": "BLOCK",
        "explanation": "Non-public financial performance data being shared with external AI system.",
        "compliance_tags": ["SOC2 CC6.7", "PCI-DSS 3.4", "EU AI Act Art. 52"],
        "blocked": True
    },
    {
        "prompt": "Help me write a response to this customer complaint from sarah.johnson@gmail.com regarding order #48291.",
        "risk_level": "MEDIUM", "confidence_score": 58,
        "categories": ["PII", "CUSTOMER_DATA"],
        "decision": "WARN",
        "explanation": "Customer email address and order details included. Consider anonymizing before submission.",
        "compliance_tags": ["GDPR Art. 5", "EU AI Act Art. 52"],
        "blocked": False
    },
    {
        "prompt": "Translate this internal memo: 'Project Nighthawk launch delayed to Q1. Do not disclose externally.'",
        "risk_level": "MEDIUM", "confidence_score": 61,
        "categories": ["INTERNAL_DOCS"],
        "decision": "WARN",
        "explanation": "Internal strategic memo marked confidential being processed by external LLM.",
        "compliance_tags": ["EU AI Act Art. 52", "ISO 27001 A.9"],
        "blocked": False
    },
    {
        "prompt": "Summarize the key points from our employee handbook section on disciplinary procedures.",
        "risk_level": "LOW", "confidence_score": 22,
        "categories": ["INTERNAL_DOCS"],
        "decision": "WARN",
        "explanation": "Internal HR document — low sensitivity but confirm this is approved for external processing.",
        "compliance_tags": ["EU AI Act Art. 52"],
        "blocked": False
    },
    {
        "prompt": "What are the best practices for writing Python unit tests with pytest?",
        "risk_level": "SAFE", "confidence_score": 0,
        "categories": [],
        "decision": "ALLOW",
        "explanation": "No sensitive content detected. General technical question.",
        "compliance_tags": [],
        "blocked": False
    },
    {
        "prompt": "Can you help me draft a professional out-of-office email reply for next week?",
        "risk_level": "SAFE", "confidence_score": 0,
        "categories": [],
        "decision": "ALLOW",
        "explanation": "No sensitive content detected. Routine productivity request.",
        "compliance_tags": [],
        "blocked": False
    },
]

result = supabase.table("incidents").insert(incidents).execute()
print(f"Seeded {len(result.data)} incidents successfully.")