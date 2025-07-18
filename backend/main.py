import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta, date

# Load environment variables from .env file
load_dotenv()

# --- Initialize Gemini client ---
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=gemini_api_key)

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_service_key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase_client: Client = create_client(supabase_url, supabase_service_key)

app = FastAPI()

# --- CORS Middleware (Crucial for frontend to backend communication) ---
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",  # Your React frontend's address
    "http://127.0.0.1:5173", # Add this for good measure
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
# --- End CORS Middleware ---

# Pydantic models for request/response bodies
class CompileLogRequest(BaseModel):
    user_id: str

class CompileLogResponse(BaseModel):
    message: str
    compiled_log_id: str
    formatted_markdown: str

@app.get("/")
async def read_root():
    return {"message": "Hello, Stride Backend! Ready for action with Gemini."}

@app.post("/compile-weekly-log/", response_model=CompileLogResponse)
async def compile_weekly_log(request: CompileLogRequest):
    user_id = request.user_id
    today = date.today()
    week_start_date_obj = today - timedelta(days=today.weekday())
    week_start_str = week_start_date_obj.isoformat()

    print(f"Compiling logs for user: {user_id} for week starting: {week_start_str}")

    try:
        response = supabase_client.table('entries').select('content').eq('user_id', user_id).gte('created_at', week_start_str).execute()
        raw_entries = response.data
        print(f"Found {len(raw_entries)} raw entries for the week.")
    except Exception as e:
        print(f"Error fetching raw entries from Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch raw entries: {e}")

    if not raw_entries:
        raise HTTPException(status_code=404, detail=f"No entries found for user {user_id} this week (starting {week_start_str}).")

    combined_raw_content = "\n\n---\n\n".join([entry['content'] for entry in raw_entries])

    # --- FIX: REMOVED THE ` ```markdown ` WRAPPER FROM THE PROMPT ---
    # This prevents the AI from adding the code block in the first place,
    # which is a cleaner solution than stripping it afterwards.
    gemini_prompt_text = (
        "You are an expert personal assistant helping a software engineer create a concise promotion journal. "
        "Review the following raw daily/session notes from a single week. Your task is to: "
        "1. Synthesize and combine similar points from the notes."
        "2. Structure the information into a single, comprehensive weekly log using the following markdown format (do NOT wrap it in a code block):\n\n"
        f"## Week of {week_start_str}\n\n"
        "✅ **What I did**\n"
        "- [Synthesized list of key tasks/projects]\n\n"
        "🎯 **Impact**\n"
        "- [Synthesized list of outcomes/achievements, quantifying where possible]\n\n"
        "🧠 **Learned**\n"
        "- [Synthesized list of new skills, technologies, insights]\n\n"
        "❓ **Questions / Next**\n"
        "- [Synthesized list of open questions, next steps, or exploration]\n\n"
        "Crucially: "
        "- Do NOT invent content. Only use information provided in the raw notes.\n"
        "- Be concise. Combine related points into single bullet items where appropriate.\n"
        "- If a section (e.g., 'Impact') has no relevant information, include the heading but write 'N/A' or 'No specific new impact noted.'\n"
        "- Use the exact markdown headings and emojis provided.\n\n"
        f"Raw Weekly Notes:\n---\n{combined_raw_content}\n---"
    )

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        response = await model.generate_content_async(
            contents=[gemini_prompt_text],
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=1000
            )
        )
        if not response.parts:
            print("Warning: Gemini response was blocked or empty.")
            print(f"Prompt Feedback: {response.prompt_feedback}")
            raise HTTPException(status_code=500, detail=f"AI response was blocked due to safety concerns. Feedback: {response.prompt_feedback}")

        # The AI response should now be clean markdown. We'll still strip just in case.
        cleaned_markdown = response.text.strip()
        print("Received formatted markdown from Gemini.")

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compile log with AI: {e}")

    try:
        existing_log_res = supabase_client.table('compiled_logs').select('id').eq('user_id', user_id).eq('week_start', week_start_str).execute()
        existing_log = existing_log_res.data

        compiled_log_id = None
        if existing_log:
            compiled_log_id = existing_log[0]['id']
            # --- FIX: Use the cleaned markdown for updates ---
            update_res = supabase_client.table('compiled_logs').update({'markdown_blob': cleaned_markdown, 'created_at': datetime.now().isoformat()}).eq('id', compiled_log_id).execute()
            print(f"Updated compiled log ID: {compiled_log_id}")
        else:
            # --- FIX: Use the cleaned markdown for inserts ---
            insert_res = supabase_client.table('compiled_logs').insert({
                'user_id': user_id,
                'week_start': week_start_str,
                'markdown_blob': cleaned_markdown,
            }).execute()
            compiled_log_id = insert_res.data[0]['id']
            print(f"Inserted new compiled log ID: {compiled_log_id}")

        return CompileLogResponse(
            message="Weekly log compiled and saved successfully!",
            compiled_log_id=str(compiled_log_id),
            # --- FIX: Return the cleaned markdown ---
            formatted_markdown=cleaned_markdown
        )
    except Exception as e:
        print(f"Error saving compiled log to Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save compiled log: {e}")