import { getAllPosts } from "@/lib/notion";
import type { Metadata } from "next";
import type { BlogPost } from "@/lib/notion";

export const metadata: Metadata = {
  title: "Sameer Kashyap — Research & Writing",
  description:
    "Technical writing on machine learning, mathematics, and computer science. Implementations of papers with derivations, code, and intuition.",
};

export const revalidate = 3600; // Revalidate every hour

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostItem({ post }: { post: BlogPost }) {
  return (
    <li className="post-item">
      <a href={`/${post.slug}`} className="post-item-inner">
        <div className="post-meta-left">
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h2 className="post-title">{post.title}</h2>
          {post.summary && (
            <p className="post-summary">{post.summary}</p>
          )}
        </div>
        <time className="post-date" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
      </a>
    </li>
  );
}

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div className="home-container">
      <div className="posts-section-title">
        <span>Writing</span>
      </div>
      <ul className="posts-list">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <li style={{ padding: "3rem 0", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "Crimson Pro, Georgia, serif", fontStyle: "italic" }}>
            No posts found. Add a Notion database ID to get started.
          </li>
        )}
      </ul>
    </div>
  );
}
