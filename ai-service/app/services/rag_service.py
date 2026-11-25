import os
import glob
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas.chat import SourceCitation
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self, knowledge_dir: str = "./knowledge_docs"):
        self.knowledge_dir = knowledge_dir
        self.chunks: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        self._load_and_chunk_documents()

    def _load_and_chunk_documents(self):
        self.chunks = []
        if not os.path.exists(self.knowledge_dir):
            return

        files = glob.glob(os.path.join(self.knowledge_dir, "*.txt"))
        for file_path in files:
            doc_name = os.path.basename(file_path)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Split by sections or paragraphs
                sections = content.split("\n\n")
                for idx, sec in enumerate(sections):
                    sec_clean = sec.strip()
                    if len(sec_clean) > 20:
                        self.chunks.append({
                            "documentId": doc_name.replace(".txt", ""),
                            "documentName": doc_name.replace("_", " ").title(),
                            "page": (idx // 3) + 1,
                            "text": sec_clean
                        })
            except Exception as e:
                print(f"Error loading {file_path}: {e}")

        if self.chunks:
            corpus = [c["text"] for c in self.chunks]
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def _generate_with_llm(self, query: str, context_passages: List[str]) -> str:
        prompt = (
            "You are MediCore AI, the assistive clinical and administrative hospital intelligence engine. "
            "Answer the user's question accurately using ONLY the approved hospital knowledge provided below. "
            "If the information is not present in the context, state that you do not have sufficient guidance.\n\n"
            f"APPROVED HOSPITAL SOP CONTEXT:\n" + "\n\n".join(context_passages) + "\n\n"
            f"USER INQUIRY: {query}\n\n"
            "ANSWER (Concise, structured, and professional):"
        )

        # 1. Try OpenAI if key exists
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and len(openai_key) > 20 and not openai_key.startswith("your_"):
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key, timeout=3.0)
                res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are MediCore AI assistive hospital assistant. Answer grounded in provided context."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content.strip()
            except Exception as e:
                pass

        # 2. Try Gemini if key exists and valid format
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and len(gemini_key) > 20 and gemini_key.startswith("AIza"):
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                response = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                pass

        # 3. Grounded Context Synthesis (SRS NFR-006: graceful degradation and 100% reliable)
        return (
            "According to MediCore Approved Hospital Policies:\n\n"
            + "\n\n".join(context_passages[:2])
            + "\n\n(Operational and clinical actions must follow attending physician sign-off)."
        )

    def search_and_answer(self, query: str, top_k: int = 3) -> Tuple[str, List[SourceCitation]]:
        if not self.chunks or self.tfidf_matrix is None:
            return (
                "MediCore Knowledge Base is currently empty or indexing. Please refer to standard hospital administrative desks.",
                []
            )

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        ranked_indices = scores.argsort()[::-1]
        top_citations: List[SourceCitation] = []
        retrieved_passages: List[str] = []

        for idx in ranked_indices[:top_k]:
            score = float(scores[idx])
            if score > 0.05:  # Relevance threshold
                chunk = self.chunks[idx]
                top_citations.append(SourceCitation(
                    documentId=chunk["documentId"],
                    documentName=chunk["documentName"],
                    page=chunk["page"],
                    snippet=chunk["text"][:160] + "...",
                    similarityScore=round(score, 3)
                ))
                retrieved_passages.append(f"[{chunk['documentName']} - Page {chunk['page']}]:\n{chunk['text']}")

        if not retrieved_passages:
            return (
                "Based on the approved MediCore Hospital Standard Operating Procedures, no specific guidance was found for your inquiry. Please consult the Hospital Administrator or Medical Superintendent for direct guidance.",
                []
            )

        answer = self._generate_with_llm(query, retrieved_passages)
        return answer, top_citations

rag_service = RAGService()
