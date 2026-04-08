import { getAllPosts, getPostBySlug } from "@/lib/notion";
import Link from "next/link";
import { markdownToHtml, extractTableOfContents } from "@/lib/markdown";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Not Found" };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export const revalidate = 3600;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TableOfContents({
  toc,
}: {
  toc: Array<{ id: string; text: string; level: number }>;
}) {
  if (toc.length === 0) return null;

  return (
    <aside className="toc-container">
      <p className="toc-title">Contents</p>
      <ul className="toc-list">
        {toc.map((item) => (
          <li
            key={item.id}
            className={`toc-item toc-item-h${item.level}`}
          >
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [htmlContent, toc] = await Promise.all([
    markdownToHtml(post.content),
    Promise.resolve(extractTableOfContents(post.content)),
  ]);

  const filteredToc = toc.filter((item) => item.level <= 3);

  return (
    <div className="article-layout">
      <article>
        {/* Back link */}
        <Link href="/" className="back-link">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All Posts
        </Link>

        {/* Article header */}
        <header className="article-header">
          {post.tags.length > 0 && (
            <div className="article-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="post-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="article-title">{post.title}</h1>

          <div className="article-meta">
            <span className="article-meta-item">
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="3"
                  width="12"
                  height="11"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 1.5V4M11 1.5V4M2 7h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>

            {post.readingTime && (
              <>
                <span className="article-meta-divider">·</span>
                <span className="article-meta-item">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 5v3.5l2 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {post.readingTime} min read
                </span>
              </>
            )}
          </div>

          {post.summary && (
            <p className="article-summary">{post.summary}</p>
          )}
        </header>

        {/* Article body */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>

      {/* Sidebar */}
      <div className="article-sidebar">
        <TableOfContents toc={filteredToc} />
      </div>
    </div>
  );
}
