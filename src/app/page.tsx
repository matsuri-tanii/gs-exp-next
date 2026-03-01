// src/app/page.tsx

"use client";
// → "use client" = このコンポーネントはブラウザで実行される
//   useState, useEffect, onClick などを使う場合に必要

// ========================================
// インポート
// ========================================

import { useState, useEffect } from "react";
// → useState: 状態管理
// → useEffect: 副作用（API呼び出しなど）

import { useRouter } from "next/navigation";
// → ページ遷移

import { createClient } from "@/lib/supabase/client";
// → Supabase クライアント

import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import PostCard from "@/components/PostCard";

import type { Post } from "@/types";
// → 型定義をインポート
// → type を付けると「型だけ」をインポート（ファイルサイズ削減）

import type { User } from "@supabase/supabase-js";
// → Supabase のユーザー型

// ========================================
// 環境変数から API URL を取得
// ========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
// → 環境変数がなければデフォルト値を使う

// ========================================
// メインページコンポーネント
// ========================================

export default function Home() {
  // ========================================
  // State の定義
  // ========================================

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatingId, setAnimatingId] = useState<number | null>(null); // → いいねアニメーション用
  const [uploading, setUploading] = useState(false);  // 画像アップロード中

  // ========================================
  // Hooks の初期化
  // ========================================

  const router = useRouter();
  const supabase = createClient();

  // ========================================
  // 初期化処理
  // ========================================

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    setLoading(false);
    // ユーザーIDを渡して投稿を取得
    fetchPosts(user.id);
  };

  // ========================================
  // 投稿一覧を取得
  // ========================================

  const fetchPosts = async (userId?: string) => {
    try {
      // userId をクエリパラメータで送る
      const url = userId
        ? `${API_URL}/api/posts?userId=${userId}`
        : `${API_URL}/api/posts`;

      const response = await fetch(url);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // ========================================
  // 画像をアップロード
  // ========================================

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // ========================================
  // 投稿を作成
  // ========================================

  const handleSubmit = async (e: React.FormEvent, imageFile: File | null) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setUploading(true);

    try {
      let imageUrl: string | null = null;

      // 画像が選択されていればアップロード
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          alert("画像のアップロードに失敗しました");
          setUploading(false);
          return;
        }
      }

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newPost,
          imageUrl,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("投稿に失敗しました");
      }

      setNewPost("");
      if (!user) return;
      fetchPosts(user.id);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setUploading(false);
    }
  };

  // ========================================
  // 投稿を削除
  // ========================================

  const handleDelete = async (id: number) => {
    if (!confirm("この投稿を削除しますか？")) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // ========================================
  // いいね処理（新規追加）
  // ========================================

  const handleLike = async (postId: number, isLiked: boolean) => {
    if (!user) return;

    // アニメーション開始
    setAnimatingId(postId);
    setTimeout(() => setAnimatingId(null), 400);

    try {
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("いいねに失敗しました");
      }

      const data = await response.json();

      // 投稿一覧を更新（該当の投稿だけ更新）
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likeCount: data.likeCount,
            isLiked: data.isLiked,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };


  // ========================================
  // ログアウト処理
  // ========================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

    // ========================================
  // ローディング中
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen">
      {/* ヘッダー（コンポーネントを使用） */}
      <Header
        userInitial={user?.email?.charAt(0).toUpperCase()}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 投稿フォーム（コンポーネントを使用） */}
        <PostForm
          userInitial={user?.email?.charAt(0).toUpperCase()}
          value={newPost}
          onChange={setNewPost}
          onSubmit={handleSubmit}
          disabled={uploading}     // Day3 追加
        />

        {/* タイムライン */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-white/50 py-12">
              まだ投稿がありません
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={post.userId === user?.id ? handleDelete : undefined}
                onLike={handleLike}
                isAnimating={animatingId === post.id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}