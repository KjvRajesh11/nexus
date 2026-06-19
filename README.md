# Nexus – AI Research Assistant

Nexus is a modern AI-powered research assistant that allows users to upload multiple documents and ask questions across them with proper citations and quality evaluation. It uses a Retrieval-Augmented Generation (RAG) pipeline to deliver transparent and verifiable answers.

## Problem Statement

Most general AI tools lack transparency when answering from user-uploaded documents. Nexus solves this by providing **cited answers** along with **real-time quality evaluation**, making responses more trustworthy.

## Key Features

- Multi-document upload and management
- Semantic retrieval using embeddings and vector database
- Inline citations with source highlighting
- RAG Evaluation metrics (Faithfulness, Context Relevance, Answer Relevance)
- Real-time streaming responses
- Chat persistence with recent threads
- Clean, professional research-focused UI

## Tech Stack

- **Frontend**: Next.js + TypeScript
- **Backend**: Next.js API Routes
- **LLM**: Groq (`llama-3.3-70b-versatile`)
- **Embeddings**: Google Gemini (`text-embedding-004`)
- **Vector Database**: Pinecone
- **Re-ranker**: Cohere Rerank
- **Orchestration**: LangGraph
- **Evaluation**: RAGAS

## Getting Started

### Prerequisites
- Node.js 18+
- Groq API Key
- Google Gemini API Key
- Pinecone API Key
- Cohere API Key

### Installation

```bash
git clone https://github.com/KjvRajesh11/nexus.git
cd nexus
npm install
Create a .env.local file and add your API keys:
envGROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key
COHERE_API_KEY=your_cohere_key
Run the development server:
Bashnpm run dev
Open http://localhost:3000

```

### Project Structure
nexus/
├── app/
│   ├── api/              # API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/             # Message bubbles, input, sources
│   └── layout/           # Sidebar, header
├── lib/
│   └── rag/              # RAG engine (chunker, embeddings, vector store, etc.)
└── public/

### Core RAG pipeline is functional
Multi-document support with citations
RAG evaluation metrics implemented
Professional dark-themed UI

#### Future Improvements:
User authentication and multi-tenancy
Better evaluation dashboard
Support for scanned PDFs (OCR)
Deployment and scaling

#### Why Nexus?
Nexus focuses on transparency and verifiability through citations and quality metrics. It uses modern 2026 technologies like LangGraph, RAGAS, and vector databases, making it suitable for research and knowledge work.

#### Author
Kavarthapu Jaya Venkata Rajesh
B.Tech @ CBIT Hyderabad
