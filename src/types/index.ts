// src/types/index.ts

// ========================================
// 投稿の型定義
// ========================================
// API から返ってくるデータの形を定義


export type Post = {
  id: number;               // → 投稿ID（数値）
  content: string;          // → 投稿内容（文字列）
  imageUrl: string | null;  // → 画像URL（文字列 or null） | = 「または」の意味
  userId: string | null;    // → 投稿者のID（文字列 or null）
  createdAt: string;        // → 作成日時（ISO 8601 形式の文字列） 例: "2024-01-01T00:00:00.000Z"
  updatedAt: string;        // → 更新日時
  likeCount: number;
  isLiked: boolean;
};

// ========================================
// サンプルデータ用の型
// ========================================
// 今日はダミーデータを使うので、この型も用意

export type SamplePost = {
  id: number;
  username: string;
  content: string;
  image: string | null;
  likes: number;
  isLiked: boolean;
  createdAt: string;
};