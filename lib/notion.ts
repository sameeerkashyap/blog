import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
  coverImage?: string;
  readingTime?: number;
}

export interface BlogPostWithContent extends BlogPost {
  content: string;
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY || "placeholder",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const n2m = new NotionToMarkdown({ notionClient: notion as any });

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function getStringProp(page: PageObjectResponse, key: string): string {
  const prop = page.properties[key];
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "select":
      return prop.select?.name ?? "";
    case "date":
      return prop.date?.start ?? "";
    case "url":
      return prop.url ?? "";
    default:
      return "";
  }
}

function getMultiSelect(page: PageObjectResponse, key: string): string[] {
  const prop = page.properties[key];
  if (!prop || prop.type !== "multi_select") return [];
  return prop.multi_select.map((s) => s.name);
}

function getBooleanProp(page: PageObjectResponse, key: string): boolean {
  const prop = page.properties[key];
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox;
}

function getCoverImage(page: PageObjectResponse): string | undefined {
  if (!page.cover) return undefined;
  if (page.cover.type === "external") return page.cover.external.url;
  if (page.cover.type === "file") return page.cover.file.url;
  return undefined;
}

function pageToPost(page: PageObjectResponse): BlogPost {
  const title =
    getStringProp(page, "Title") || getStringProp(page, "Name");
  const customSlug = getStringProp(page, "Slug");
  return {
    id: page.id,
    title,
    slug: customSlug || generateSlug(title),
    summary:
      getStringProp(page, "Summary") ||
      getStringProp(page, "Description"),
    date:
      getStringProp(page, "Date") ||
      page.created_time.split("T")[0],
    tags: getMultiSelect(page, "Tags"),
    published: getBooleanProp(page, "Published"),
    coverImage: getCoverImage(page),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return getMockPosts();
  }

  try {
    // v5 SDK: databases.query moved to dataSources.query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = notion as any;

    let response;
    try {
      response = await client.dataSources.query({
        data_source_id: process.env.NOTION_DATABASE_ID,
        filter: {
          property: "Published",
          checkbox: { equals: true },
        } as never,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      });
    } catch {
      // Published property missing — fetch all pages
      response = await client.dataSources.query({
        data_source_id: process.env.NOTION_DATABASE_ID,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      });
    }

    return (response.results as PageObjectResponse[])
      .filter((p) => p.object === "page")
      .map(pageToPost)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  } catch (err) {
    console.error("Notion getAllPosts error:", err);
    return getMockPosts();
  }
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostWithContent | null> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    const all = getMockPostsWithContent();
    return all.find((p) => p.slug === slug) ?? null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = notion as any;

    // Fetch all published posts and match by slug (generated or explicit)
    const all = await client.dataSources.query({
      data_source_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Published",
        checkbox: { equals: true },
      } as never,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const pages = (all.results as PageObjectResponse[]).filter(
      (p) => p.object === "page"
    );

    const page = pages.find((p) => {
      const customSlug = getStringProp(p, "Slug");
      if (customSlug && customSlug === slug) return true;
      const title = getStringProp(p, "Title") || getStringProp(p, "Name");
      return generateSlug(title) === slug;
    });

    if (!page) return null;

    const post = pageToPost(page);
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const content = n2m.toMarkdownString(mdBlocks).parent;

    return {
      ...post,
      content,
      readingTime: estimateReadingTime(content),
    };
  } catch (err) {
    console.error("Notion getPostBySlug error:", err);
    return null;
  }
}

// ─── Mock data (used without Notion credentials) ──────────────────────────────

function getMockPosts(): BlogPost[] {
  return MOCK_POSTS;
}

function getMockPostsWithContent(): BlogPostWithContent[] {
  return MOCK_POSTS.map((p) => ({
    ...p,
    content: MOCK_CONTENT[p.id] ?? `# ${p.title}\n\n${p.summary}`,
    readingTime: 8,
  }));
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Attention Is All You Need: A Deep Dive into Transformers",
    slug: "attention-is-all-you-need",
    summary:
      "An implementation walkthrough of the original Transformer architecture, exploring multi-head self-attention, positional encodings, and the mathematics behind why this architecture changed everything.",
    date: "2024-03-15",
    tags: ["Deep Learning", "NLP", "Transformers"],
    published: true,
  },
  {
    id: "2",
    title: "Diffusion Models from First Principles",
    slug: "diffusion-models-from-first-principles",
    summary:
      "Breaking down DDPM, score matching, and the connection to stochastic differential equations. We implement a toy diffusion model and derive the ELBO from scratch.",
    date: "2024-02-28",
    tags: ["Generative Models", "Probabilistic ML"],
    published: true,
  },
  {
    id: "3",
    title: "Reinforcement Learning from Human Feedback",
    slug: "rlhf-explained",
    summary:
      "How InstructGPT and Claude use human preference data to align language models. Covers reward modeling, PPO, and the mathematical foundations of preference optimization.",
    date: "2024-02-10",
    tags: ["RL", "LLMs", "Alignment"],
    published: true,
  },
  {
    id: "4",
    title: "Flash Attention: Making Attention IO-Aware",
    slug: "flash-attention",
    summary:
      "How FlashAttention achieves 2–4× speedup over standard attention by being memory-bandwidth aware. We explore the tiling algorithm and CUDA optimizations.",
    date: "2024-01-20",
    tags: ["Efficiency", "CUDA", "Transformers"],
    published: true,
  },
  {
    id: "5",
    title: "Neural Tangent Kernels and Infinite-Width Networks",
    slug: "neural-tangent-kernels",
    summary:
      "What happens when you take a neural network to infinite width? The NTK theory provides a surprising connection between deep learning and kernel methods.",
    date: "2023-12-05",
    tags: ["Theory", "Optimization"],
    published: true,
  },
];

const MOCK_CONTENT: Record<string, string> = {
  "1": `
The Transformer architecture, introduced by Vaswani et al. in 2017, fundamentally reshaped natural language processing. Unlike recurrent networks that process sequences step-by-step, Transformers process all tokens simultaneously using **self-attention**.

## The Core Idea: Attention

At its heart, attention asks: *which parts of the input should I focus on when computing this output?*

Given queries $Q$, keys $K$, and values $V$, attention is:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

The $\\sqrt{d_k}$ scaling prevents the dot products from growing too large, keeping gradients stable.

## Multi-Head Attention

Instead of a single attention, we project into $h$ subspaces and concatenate:

$$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_h)\\, W^O$$

where $\\text{head}_i = \\text{Attention}(QW_i^Q,\\; KW_i^K,\\; VW_i^V)$.

## Positional Encoding

Since attention is permutation-invariant, we inject position via sinusoids:

$$PE_{(pos,\\, 2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d_{\\text{model}}}}\\right), \\qquad PE_{(pos,\\, 2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d_{\\text{model}}}}\\right)$$

This lets the model attend by relative position, since $PE_{pos+k}$ is a linear function of $PE_{pos}$.

## Implementation

\`\`\`python
import torch, torch.nn as nn, math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int):
        super().__init__()
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, Q, K, V, mask=None):
        B = Q.size(0)
        # Project & reshape → (B, h, T, d_k)
        Q = self.W_q(Q).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(K).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(V).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)

        scores = Q @ K.transpose(-2, -1) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = scores.softmax(dim=-1)

        x = (attn @ V).transpose(1, 2).contiguous().view(B, -1, self.n_heads * self.d_k)
        return self.W_o(x)
\`\`\`

## Why It Works

Attention implements a **soft, differentiable database lookup**: the query $Q$ is what we're looking for; keys $K$ describe each position's offering; values $V$ hold the actual content. The $n \\times n$ attention matrix—origin of the notorious $O(n^2)$ cost—is what Flash Attention later optimises.

## Feed-Forward Sub-Layer

Each Transformer block also runs a position-wise MLP:

$$\\text{FFN}(x) = \\max(0,\\; xW_1 + b_1)\\, W_2 + b_2$$

Typically $d_{ff} = 4 d_{\\text{model}}$; this accounts for roughly two-thirds of all parameters.
`,
  "2": `
Diffusion models have become the backbone of the best generative systems—DALL-E 3, Stable Diffusion, Sora. Let's build the theory from scratch.

## Forward Process

We define a Markovian noising chain of length $T$:

$$q(\\mathbf{x}_t \\mid \\mathbf{x}_{t-1}) = \\mathcal{N}\\!\\left(\\mathbf{x}_t;\\; \\sqrt{1-\\beta_t}\\,\\mathbf{x}_{t-1},\\; \\beta_t\\mathbf{I}\\right)$$

A key closed-form: we can sample $\\mathbf{x}_t$ directly from $\\mathbf{x}_0$:

$$\\mathbf{x}_t = \\sqrt{\\bar\\alpha_t}\\,\\mathbf{x}_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\boldsymbol\\epsilon, \\qquad \\boldsymbol\\epsilon \\sim \\mathcal{N}(0,\\mathbf{I})$$

where $\\bar\\alpha_t = \\prod_{s=1}^t (1-\\beta_s)$.

## Training Objective

The full ELBO simplifies to a remarkably clean loss—just predict the noise:

$$L_{\\text{simple}} = \\mathbb{E}_{t,\\mathbf{x}_0,\\boldsymbol\\epsilon}\\!\\left[\\|\\boldsymbol\\epsilon - \\boldsymbol\\epsilon_\\theta(\\mathbf{x}_t, t)\\|^2\\right]$$

## Minimal PyTorch Implementation

\`\`\`python
import torch

class DDPM:
    def __init__(self, T=1000, beta_start=1e-4, beta_end=0.02):
        self.betas = torch.linspace(beta_start, beta_end, T)
        self.alpha_bars = torch.cumprod(1 - self.betas, dim=0)

    def q_sample(self, x0, t):
        noise = torch.randn_like(x0)
        ab = self.alpha_bars[t].view(-1, 1, 1, 1)
        return ab.sqrt() * x0 + (1 - ab).sqrt() * noise, noise

    def train_step(self, model, x0, optimizer):
        t = torch.randint(0, len(self.betas), (x0.shape[0],))
        x_t, noise = self.q_sample(x0, t)
        loss = ((noise - model(x_t, t)) ** 2).mean()
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        return loss.item()
\`\`\`

## Score Matching Perspective

Score matching gives another view. If $s_\\theta(\\mathbf{x},t) = \\nabla_{\\mathbf{x}}\\log p_t(\\mathbf{x})$ is the score, the denoising objective is equivalent to matching the score of the noising kernel. The two are related by:

$$\\boldsymbol\\epsilon = -\\sqrt{1-\\bar\\alpha_t}\\cdot s(\\mathbf{x}_t, t)$$

unifying noise-prediction and score-matching into a single framework.
`,
};
