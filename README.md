# Nexus – AI Research Assistant

Nexus is a research-focused AI assistant that enables users to upload multiple documents and ask questions across them with transparent citations and quality evaluation. It is built using a modern Retrieval-Augmented Generation (RAG) architecture designed for reliability and verifiability.

## Problem Statement

Most general-purpose AI tools lack transparency when answering questions from user-uploaded documents. Users often cannot verify the source of the information or assess the quality of the response. Nexus addresses this by combining semantic retrieval with inline citations and real-time evaluation metrics, making answers more trustworthy and auditable.

## Key Features

- **Multi-Document Support**: Upload and manage multiple documents (PDF, TXT, CSV) in a personal library.
- **Semantic Retrieval**: Uses embeddings and a vector database to find relevant information across documents.
- **Inline Citations**: Every answer includes citations that link back to the original source passages.
- **RAG Evaluation**: Displays real-time quality scores (Faithfulness, Context Relevance, and Answer Relevance) for each response.
- **Streaming Responses**: Answers are generated token-by-token for a smooth experience.
- **Chat Persistence**: Conversations are saved locally with easy access to recent threads.
- **Professional UI**: Clean, research-oriented dark theme designed for focused work.

## Tech Stack

Nexus is built using a modern 2026 RAG stack:

- **Frontend**: Next.js + TypeScript
- **Backend**: Next.js API Routes
- **LLM**: Groq (`llama-3.3-70b-versatile`)
- **Embeddings**: Google Gemini (`text-embedding-004`)
- **Vector Database**: Pinecone
- **Re-ranker**: Cohere Rerank
- **Orchestration**: LangGraph
- **Evaluation Framework**: RAGAS

## Getting Started

### Prerequisites
- Node.js 18 or above
- Groq API Key
- Google Gemini API Key
- Pinecone API Key
- Cohere API Key

### Installation

```bash
git clone https://github.com/KjvRajesh11/nexus.git
cd nexus
npm install
```

Create a `.env.local` file in the root directory and add your API keys:

```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
COHERE_API_KEY=your_cohere_api_key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nexus/
├── app/
│   ├── api/              # API routes (chat, document ingestion, etc.)
│   ├── layout.tsx
│   └── page.tsx          # Main application
├── components/
│   ├── chat/             # Message bubbles, input area, source cards
│   └── layout/           # Sidebar, header, settings
├── lib/
│   └── rag/              # Core RAG engine (chunking, embeddings, retrieval, evaluation)
└── public/
```

## Current Status

The core functionality of Nexus is complete, including:
- Multi-document upload and semantic retrieval
- Inline citations and source highlighting
- Real-time RAG evaluation metrics
- Streaming responses
- Professional dark-themed UI

The project is currently at an MVP stage and demonstrates a solid understanding of modern RAG systems.

## Future Improvements

- Add user authentication and multi-tenancy support
- Build a more advanced evaluation dashboard
- Add support for scanned documents using OCR
- Improve scalability and deployment setup
- Explore agentic workflows for multi-step research tasks

## Why Nexus?

Nexus stands out by prioritizing **transparency and verifiability**. Unlike many AI chat tools, it provides citations and quality evaluation alongside every answer. The project uses current 2026 technologies such as LangGraph, RAGAS, and vector databases, reflecting strong technical awareness and engineering practices suitable for research and knowledge-intensive work.

## Author

**Kavarthapu Jaya Venkata Rajesh**  
B.Tech @CBIT , Hyderabad
