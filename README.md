# PDF Mapper & Generator 📄✨

**Stop filling out the same PDF over and over again.**

We've all been there: opening a static PDF form, manually clicking through fields, typing the same data for the hundredth time, and hoping you didn't make a typo. And the next time you need it? You start from scratch.

**PDF Mapper solves this.** It turns your static, flat PDF documents into **dynamic, data-driven templates**.

- **Map Once**: Draw fields on your PDF visually.
- **Generate Infinitely**: Feed it JSON data (or use our Form View) to create perfect, filled PDFs instantly.
- **Save Your Work**: Export your mapping as a lightweight JSON template. Never re-map the same form again.

Built with **Next.js 14**, **React**, and **pdf-lib** for a fast, client-side experience.

## 🚀 Features

### 1. Visual Field Mapping
- **Interactive Canvas**: Upload any PDF and draw mapping zones directly onto the document.
- **Precision Controls**: Drag, resize, and fine-tune field positions.
- **Field Properties**:
  - **Key**: The unique JSON identifier for the data.
  - **Type**: Text, Checkbox, or Date.
  - **Font Size**: Control text size (`Small` - 7pt, `Medium` - 9pt, `Large` - 12pt).

### 2. Live Generation & Preview
- **Split-View Interface**: See your data form and the resulting PDF side-by-side.
- **Dual Input Modes**:
  - **Form View**: Auto-generated, user-friendly inputs sorted logically by page and position.
  - **JSON View**: Raw JSON editor for power users, developers, and bulk data pasting.
- **Real-Time Updates**: PDF preview updates automatically (debounced) as you type.
- **Client-Side Generation**: Zero-latency PDF creation using `pdf-lib` in the browser.

### 3. Template Management
- **Save/Load**: Export your mapping schema to a `.template.json` file and reload it later.
- **Portable Schemas**: JSON-based templates are easy to version control and share.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engine**: [pdf-lib](https://pdf-lib.js.org/) (Client-side generation)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LLMFAO/pdfmapper.git
   cd pdfmapper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   Navigate to [http://localhost:3000/mapper](http://localhost:3000/mapper).

## 📖 Usage Guide

### Phase 1: Mapping
1. **Upload**: Click "Upload PDF" and select your blank PDF form.
2. **Draw**: Click and drag on the PDF canvas to create a new field box.
3. **Configure**: In the right sidebar:
   - Assign a unique `Field Key` (e.g., `patient_name`).
   - Select the `Type` (Text or Checkbox).
   - *Optional:* Adjust `Font Size` for text fields.
4. **Repeat**: Map all necessary fields on the document.
5. **Save**: Click **Save Template** to download the mapping configuration (`.template.json`).

### Phase 2: Generating
1. Click **Generate PDF** in the top header.
2. The **Generation Modal** will open.
3. **Enter Data**:
   - Use the **Form** tab to fill in fields manually.
   - Or switch to **JSON** tab to paste a complete data object.
4. **Preview**: The PDF on the right will update automatically.
5. **Download**: Click **Download Final PDF** to save the filled document.

## 🧩 Template Architecture

The template file is a standard JSON array of field definitions:

```json
[
  {
    "id": "uuid-v4",
    "key": "full_name",
    "type": "text",
    "fontSize": "medium",
    "page_number": 1,
    "rect": {
      "x": 0.15, // Percentage of page width (0-1)
      "y": 0.25, // Percentage of page height (0-1)
      "w": 0.30,
      "h": 0.05
    }
  }
]
```

## 🚢 Deployment

This project acts as a static Next.js application (or server-side). It is configured for deployment on **Netlify** or **Vercel**.

**Build Command:** `npm run build`
**Output Directory:** `.next`

---
*Built with ❤️ by Anti-Gravity Agent*
