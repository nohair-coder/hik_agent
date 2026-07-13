// API 类型定义

export interface GenerateRequest {
  question: string;
  doc_type?: string;
  extra_requirements?: string;
}

export interface IngestResult {
  status: string;
  filename: string;
  category: string;
  new_chunks: number;
  skipped_chunks: number;
  total_chunks: number;
}

export interface CollectionStats {
  engineering_docs: {
    collection: string;
    chunk_count: number;
    description: string;
  };
  style_samples: {
    collection: string;
    chunk_count: number;
    description: string;
  };
}

export interface DocumentItem {
  source_file: string;
  file_type: string;
  doc_category: string;
  chunk_count: number;
}

export interface HealthResult {
  online: boolean;
  model?: string;
}
