# PDF Mapper & Generator 📄✨

**Stop filling out the same PDF over and over again.**

[**Live Demo: pdfmap.netlify.app**](https://pdfmap.netlify.app)

![PDF Mapper Tour](screenshots/readme.gif)

Sick of the PDF Edit PITA? Me too. 

**PDF Mapper** turns your static, flat PDF documents into **dynamic, data-driven templates**.

- **Map Once**: Draw fields on your PDF visually.
- **Generate Infinitely**: Feed it JSON data to create perfect, filled PDFs instantly.
- **Save Your Work**: Export your mapping as a lightweight JSON template.

## 🔒 Security & Privacy: 100% Client-Side
Unlike other "AI PDF" tools, **no AI is used to process your documents.** 
- **Deterministic Processing**: All data injection and PDF creation is done purely with code (`pdf-lib`) in your browser.
- **Your Data Stays Local**: Your PDFs and data never touch a server or an LLM. Data is processed in your machine's RAM and disappears when you close the tab.
- **Zero AI Hallucinations**: Because there is no AI in the core generation engine, the data goes exactly where you map it—every time.


## 🚀 The Power of Discrete Data Fields

![Mapped PDF Example](screenshots/mapped-pdf.png)

Unlike standard PDF editors where you just "type text," PDF Mapper assigns a **unique JSON key** (e.g., `patient_diagnosis`, `billing_id`) to every box you draw.

This means your PDF is no longer a document—it's an **API Endpoint**.

### 🤖 AI & Automation Workflows
Because every field relies on structured JSON data, PDF Mapper becomes a powerful endpoint for your automation tools.

#### 1. The "n8n" Webhook Workflow
- **Trigger**: A typeform submission, Google Sheet row, or CRM update.
- **Process**: n8n formats the data into your template's JSON schema.
- **Action**: Generate standardized invoices, contracts, or applications instantly.

#### 2. AI Agents (Legal, HR, Real Estate)
- **Input**: Unstructured emails or meeting transcripts.
- **Analysis**: LLM (ChatGPT/Claude) extracts key entities (names, dates, clauses).
- **Output**: JSON that fills strict government or corporate PDF forms automatically.

#### 3. Healthcare & Ambient Scribes
- **Scenario**: Listen to a patient visit -> Extract discrete clinical data -> Generate reliable insurance authorization forms.

This tool bridges the gap between **unstructured AI intelligence** and **rigid document requirements**.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engine**: [pdf-lib](https://pdf-lib.js.org/) (Client-side generation)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

## 🗺️ Roadmap

- [x] Client-Side Visual Mapping
- [x] Live Preview & Generation
- [x] Form & JSON Input Modes
- [ ] **Python API Service**: A dedicated backend service to allow AI Agents (like ChatGPT/Gemini) to "call" this tool as an API function to generate PDFs programmatically without a UI.

## 📦 Usage Guide

### 🧪 Quick Start (Try it yourself)
We've included test files in the `test_files/` directory so you can experience the full workflow immediately:

1.  **Upload PDF**: Use `test_files/CO-NHP-psychological-nuero-testing-auth-request-form.pdf`.
2.  **Import Template**: Click **Import Template** and select `test_files/greyrock-layout-updated.json`.
    - *You will see dozens of fields instantly mapped onto the document.*
3.  **Generate**: Click **Generate PDF**, switch to **JSON View**, and paste the content of `test_files/mockdata.json`.
4.  **Result**: Watch the PDF fill automatically with complex, real-world data.

### Standard Workflow
1. **Upload**: Select your blank PDF.
2. **Map**: Draw boxes. Each box represents a discrete data field in your future JSON.
3. **Generate**: Provide the data.
   - **Form View**: Use the auto-generated form for quick, granular edits.
     
     ![Form View](screenshots/generate-form.png)
     
   - **JSON View**: Switch to JSON mode to paste entire datasets or API payloads.
     
     ![JSON View](screenshots/generate-json.png)

   *The PDF preview updates automatically in real-time.*
4. **Download**: Get your flattened, production-ready PDF.

---

