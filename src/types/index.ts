// src/types/index.ts

// ========================================
// 投稿の型定義
// ========================================
// API から返ってくるデータの形を定義

export type Post = {
  id: number;
  content: string;
  imageUrl: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;

  // ========================================
  // 追加: いいね関連
  // ========================================
  likeCount: number;   // いいね数
  isLiked: boolean;    // ログインユーザーがいいねしているか
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