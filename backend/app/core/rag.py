import os
from pathlib import Path
from typing import List, Optional

import qdrant_client
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings,
)
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core.vector_stores.types import MetadataFilters, ExactMatchFilter
from uuid import UUID

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

DATA_DIR = Path(__file__).parent.parent.parent / "data"
QDRANT_DB_DIR = Path(__file__).parent.parent.parent / "qdrant_db"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
QDRANT_DB_DIR.mkdir(parents=True, exist_ok=True)

# Setup Global Settings for LlamaIndex
Settings.llm = Ollama(model=LLM_MODEL, base_url=OLLAMA_HOST, request_timeout=120.0)
Settings.embed_model = OllamaEmbedding(model_name=EMBEDDING_MODEL, base_url=OLLAMA_HOST)

# --- Lazy Qdrant Initialization ---
# We do NOT create the Qdrant client at module import time.
# This prevents the "AlreadyLocked" crash when uvicorn --reload triggers
# a re-import of this module while the main process still holds the lock.
_client = None
_vector_store = None
_storage_context = None


def _get_qdrant_resources():
    """Lazily initialize Qdrant client and vector store on first use."""
    global _client, _vector_store, _storage_context
    if _client is None:
        _client = qdrant_client.QdrantClient(path=str(QDRANT_DB_DIR))
        _vector_store = QdrantVectorStore(client=_client, collection_name="nexus_knowledge_base")
        _storage_context = StorageContext.from_defaults(vector_store=_vector_store)
    return _client, _vector_store, _storage_context


def get_index() -> VectorStoreIndex:
    _, vector_store, storage_context = _get_qdrant_resources()
    return VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)


def ingest_document(file_path: str, department_id: UUID, doc_id: UUID):
    """Embeds a single uploaded document with strict department metadata tracking."""
    _, _, storage_context = _get_qdrant_resources()
    documents = SimpleDirectoryReader(input_files=[file_path]).load_data()

    # Inject strict department metadata into every chunk
    for doc in documents:
        doc.metadata["department_id"] = str(department_id)
        doc.metadata["document_id"] = str(doc_id)

    VectorStoreIndex.from_documents(documents, storage_context=storage_context)
    print(f"Secured and embedded document {doc_id} for department {department_id}")


def get_chat_engine(department_id: UUID):
    """Returns a chat engine instance strictly filtered to the user's department."""
    index = get_index()
    filters = MetadataFilters(
        filters=[ExactMatchFilter(key="department_id", value=str(department_id))]
    )
    return index.as_chat_engine(
        chat_mode="condense_question",
        verbose=True,
        filters=filters  # STRICT ISOLATION FILTER
    )
