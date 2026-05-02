from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from supabase import create_client
from dotenv import load_dotenv
import os
import json
from datetime import datetime, timezone

load_dotenv()

app = FastAPI(title="GhostWire API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

class ScanRequest(BaseModel):
    prompt: str

CLASSIFICATION_PROMPT = """You are a cybersecurity classification engine for enterprise AI governance.
Analyze the following prompt for sensitive data exposure risks.

Detect these categories if present:
- API_KEY: API keys, tokens, secrets, credentials
- PASSWORD: passwords, passphrases
- PII: names, emails, phone numbers, SSN, addresses
- FINANCIAL: bank accounts, card numbers, financial records
- SOURCE_CODE: proprietary code, internal scripts
- INTERNAL_DOCS: contracts, strategy docs, confidential memos
- CUSTOMER_DATA: customer records, user databases

Severity rules:
- CRITICAL (score 85-100): API keys, passwords, bulk PII → BLOCK
- HIGH (score 60-84): source code, financial data, customer records → BLOCK  
- MEDIUM (score 30-59): internal docs, partial PII → WARN
- LOW (score 1-29): vague references, no clear sensitive data → WARN
- SAFE (score 0): no sensitive content → ALLOW

Compliance mapping:
- PII/CUSTOMER_DATA → GDPR Art. 5, GDPR Art. 9
- API_KEY/PASSWORD → SOC2 CC6.1, ISO 27001 A.9
- FINANCIAL → PCI-DSS 3.4, SOC2 CC6.7
- Any sensitive data → EU AI Act Art. 52
- Healthcare data → HIPAA 164.312

Return ONLY valid JSON, no markdown, no explanation outside JSON:
{
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW|SAFE",
  "confidence_score": 0-100,
  "categories": ["CATEGORY1", "CATEGORY2"],
  "decision": "BLOCK|WARN|ALLOW",
  "explanation": "One sentence explaining what was detected and why it is risky.",
  "compliance_tags": ["GDPR Art. 5", "SOC2 CC6.1"]
}

Prompt to analyze: """

@app.get("/")
def root():
    return {"status": "GhostWire API running", "version": "1.0.0"}

@app.post("/api/scan")
async def scan_prompt(request: ScanRequest):
    if not request.prompt or len(request.prompt.strip()) == 0:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": CLASSIFICATION_PROMPT + f'"{request.prompt}"'
                }
            ],
            temperature=0.1,
            max_tokens=500,
        )
        
        raw = response.choices[0].message.content.strip()
        
        # Strip markdown if model adds it
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        
        result = json.loads(raw)
        
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        result = {
            "risk_level": "HIGH",
            "confidence_score": 75,
            "categories": ["UNKNOWN"],
            "decision": "WARN",
            "explanation": "Unable to fully classify prompt. Manual review recommended.",
            "compliance_tags": ["EU AI Act Art. 52"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")
    
    # Write to Supabase
    try:
        incident = {
            "prompt": request.prompt,
            "risk_level": result.get("risk_level", "UNKNOWN"),
            "confidence_score": result.get("confidence_score", 0),
            "categories": result.get("categories", []),
            "decision": result.get("decision", "WARN"),
            "explanation": result.get("explanation", ""),
            "compliance_tags": result.get("compliance_tags", []),
            "blocked": result.get("decision") == "BLOCK"
        }
        supabase.table("incidents").insert(incident).execute()
    except Exception as e:
        # Don't fail the request if DB write fails
        print(f"DB write failed: {e}")
    
    return result

@app.get("/api/incidents")
async def get_incidents():
    try:
        response = supabase.table("incidents")\
            .select("id, created_at, risk_level, confidence_score, categories, decision, compliance_tags, blocked")\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        return {"incidents": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    try:
        response = supabase.table("incidents")\
            .select("*")\
            .eq("id", incident_id)\
            .single()\
            .execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Incident not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    try:
        all = supabase.table("incidents").select("risk_level, decision, blocked, categories").execute()
        data = all.data
        total = len(data)
        blocked = sum(1 for i in data if i.get("blocked"))
        by_severity = {}
        for i in data:
            rl = i.get("risk_level", "UNKNOWN")
            by_severity[rl] = by_severity.get(rl, 0) + 1
        return {
            "total": total,
            "blocked": blocked,
            "allowed": total - blocked,
            "by_severity": by_severity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))