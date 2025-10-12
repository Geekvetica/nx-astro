# Examples

This guide provides practical, real-world examples of using the nx-astro plugin in various scenarios. Each example includes complete setup instructions and working code.

## Table of Contents

- [Basic Monorepo Setup](#basic-monorepo-setup)
- [Multiple Astro Applications](#multiple-astro-applications)
- [Shared Component Library](#shared-component-library)
- [Content Collections Blog](#content-collections-blog)
- [SSR Application](#ssr-application)
- [Testing Strategies](#testing-strategies)
- [CI/CD Integration](#cicd-integration)
- [Deployment Examples](#deployment-examples)

---

## Basic Monorepo Setup

The simplest nx-astro setup with a single application.

### Setup

```bash
# Create workspace
npx create-nx-workspace@latest my-workspace --preset=apps

# Navigate to workspace
cd my-workspace

# Install and initialize nx-astro
npm install --save-dev @geekvetica/nx-astro
npx nx g @geekvetica/nx-astro:init

# Create first application
npx nx g @geekvetica/nx-astro:application my-app --template=minimal
```

### Structure

```
my-workspace/
├── apps/
│   └── my-app/
│       ├── src/
│       │   ├── pages/
│       │   │   └── index.astro
│       │   ├── components/
│       │   └── layouts/
│       ├── public/
│       ├── astro.config.mjs
│       └── tsconfig.json
├── nx.json
├── package.json
└── tsconfig.base.json
```

### Development Workflow

```bash
# Start development
npx nx dev my-app

# Build for production
npx nx build my-app

# Preview production build
npx nx preview my-app

# Type check
npx nx check my-app
```

### Benefits

- Clean separation of projects
- Nx caching for faster rebuilds
- Consistent tooling across workspace

---

## Multiple Astro Applications

Managing multiple related sites in one monorepo.

### Use Case

A company with marketing site, blog, and documentation.

### Setup

```bash
# Create workspace
npx create-nx-workspace@latest my-company --preset=apps
cd my-company

# Install nx-astro
npm install --save-dev @geekvetica/nx-astro
npx nx g @geekvetica/nx-astro:init

# Create marketing site
npx nx g @geekvetica/nx-astro:application marketing \
  --directory=apps/marketing \
  --template=minimal \
  --tags="frontend,public,marketing"

# Create blog
npx nx g @geekvetica/nx-astro:application blog \
  --directory=apps/blog \
  --template=blog \
  --tags="frontend,public,content"

# Create docs
npx nx g @geekvetica/nx-astro:application docs \
  --directory=apps/docs \
  --template=minimal \
  --tags="frontend,public,docs"
```

### Structure

```
my-company/
├── apps/
│   ├── marketing/         # Main website
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro
│   │   │   │   ├── about.astro
│   │   │   │   └── contact.astro
│   │   │   └── components/
│   │   │       ├── Hero.astro
│   │   │       └── Features.astro
│   │   └── astro.config.mjs
│   │
│   ├── blog/              # Company blog
│   │   ├── src/
│   │   │   ├── content/
│   │   │   │   ├── config.ts
│   │   │   │   └── blog/
│   │   │   └── pages/
│   │   └── astro.config.mjs
│   │
│   └── docs/              # Documentation
│       ├── src/
│       │   └── pages/
│       └── astro.config.mjs
└── libs/                  # Shared code (coming next)
```

### Configuration

Different configurations per app:

```javascript
// apps/marketing/astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  server: { port: 4321 },
});

// apps/blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://blog.example.com',
  integrations: [mdx()],
  server: { port: 4322 },
});

// apps/docs/astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.example.com',
  server: { port: 4323 },
});
```

### Workflow

```bash
# Run all dev servers in parallel
npx nx run-many --target=dev --projects=marketing,blog,docs --parallel=3

# Build all sites
npx nx run-many --target=build --all

# Build only affected sites
npx nx affected --target=build

# Build with dependencies
npx nx build marketing --with-deps
```

### Port Management

Avoid conflicts by assigning unique ports:

```json
// project.json for each app
{
  "targets": {
    "dev": {
      "options": {
        "port": 4321 // marketing
      }
    }
  }
}
```

---

## Shared Component Library

Creating reusable components across multiple Astro apps.

### Setup

```bash
# Create shared UI library
npx nx g @nx/js:library shared-ui \
  --directory=libs/shared-ui \
  --unitTestRunner=vitest

# Create directory structure
mkdir -p libs/shared-ui/src/components
mkdir -p libs/shared-ui/src/layouts
```

### Structure

```
libs/
└── shared-ui/
    └── src/
        ├── components/
        │   ├── Button.astro
        │   ├── Card.astro
        │   ├── Navigation.astro
        │   └── Footer.astro
        ├── layouts/
        │   ├── BaseLayout.astro
        │   └── BlogLayout.astro
        └── index.ts               # Barrel export
```

### Components

```astro
<!-- libs/shared-ui/src/components/Button.astro -->
---
interface Props {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  type?: 'button' | 'submit' | 'reset';
}

const {
  variant = 'primary',
  size = 'md',
  href,
  type = 'button'
} = Astro.props;

const Tag = href ? 'a' : 'button';
const extraProps = href ? { href } : { type };
---

<Tag
  class={`btn btn--${variant} btn--${size}`}
  {...extraProps}
>
  <slot />
</Tag>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn--primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn--primary:hover {
    background-color: #2563eb;
  }

  .btn--secondary {
    background-color: #6b7280;
    color: white;
  }

  .btn--outline {
    background-color: transparent;
    border: 2px solid #3b82f6;
    color: #3b82f6;
  }

  .btn--sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; }
  .btn--md { padding: 0.5rem 1rem; font-size: 1rem; }
  .btn--lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
</style>
```

```astro
<!-- libs/shared-ui/src/components/Card.astro -->
---
interface Props {
  title: string;
  image?: string;
  href?: string;
}

const { title, image, href } = Astro.props;
const Tag = href ? 'a' : 'div';
---

<Tag class="card" {href}>
  {image && (
    <div class="card__image">
      <img src={image} alt={title} />
    </div>
  )}
  <div class="card__content">
    <h3 class="card__title">{title}</h3>
    <div class="card__body">
      <slot />
    </div>
  </div>
</Tag>

<style>
  .card {
    display: block;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: inherit;
  }

  a.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card__image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .card__content {
    padding: 1.5rem;
  }

  .card__title {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .card__body {
    color: #6b7280;
  }
</style>
```

### Layout

```astro
<!-- libs/shared-ui/src/layouts/BaseLayout.astro -->
---
interface Props {
  title: string;
  description?: string;
}

const { title, description = 'My awesome site' } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/blog">Blog</a>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>&copy; 2025 My Company</p>
    </footer>
  </body>
</html>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  header {
    background: #1e293b;
    color: white;
    padding: 1rem 2rem;
  }

  nav {
    display: flex;
    gap: 2rem;
  }

  nav a {
    color: white;
    text-decoration: none;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    min-height: calc(100vh - 200px);
  }

  footer {
    background: #f3f4f6;
    padding: 2rem;
    text-align: center;
  }
</style>
```

### Path Aliases

Configure imports in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@my-org/shared-ui": ["libs/shared-ui/src/index.ts"],
      "@my-org/shared-ui/*": ["libs/shared-ui/src/*"]
    }
  }
}
```

### Usage in Apps

```astro
<!-- apps/marketing/src/pages/index.astro -->
---
import BaseLayout from '@my-org/shared-ui/layouts/BaseLayout.astro';
import Button from '@my-org/shared-ui/components/Button.astro';
import Card from '@my-org/shared-ui/components/Card.astro';
---

<BaseLayout title="Home" description="Welcome to our site">
  <section>
    <h1>Welcome</h1>
    <p>Build amazing things with Astro and Nx</p>
    <Button variant="primary" size="lg" href="/get-started">
      Get Started
    </Button>
  </section>

  <section>
    <h2>Features</h2>
    <div class="grid">
      <Card title="Fast Builds">
        <p>Lightning-fast builds with Nx caching</p>
      </Card>
      <Card title="Shared Code">
        <p>Reuse components across all apps</p>
      </Card>
      <Card title="Type Safe">
        <p>Full TypeScript support</p>
      </Card>
    </div>
  </section>
</BaseLayout>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }
</style>
```

### Benefits

- Consistent UI across all apps
- Single source of truth for components
- Easy to update all apps by changing library
- Better type safety with shared interfaces

---

## Content Collections Blog

Building a blog with content collections and type-safe content.

### Setup

```bash
# Create blog application
npx nx g @geekvetica/nx-astro:application blog --template=blog

# Generate types for content
npx nx sync blog
```

### Content Structure

```
apps/blog/
└── src/
    ├── content/
    │   ├── config.ts              # Content schema
    │   └── blog/                  # Blog posts
    │       ├── first-post.md
    │       ├── second-post.md
    │       └── third-post.md
    ├── pages/
    │   ├── index.astro            # Blog list
    │   ├── blog/
    │   │   └── [...slug].astro    # Blog post page
    │   └── rss.xml.ts             # RSS feed
    └── components/
        ├── BlogPost.astro
        └── BlogCard.astro
```

### Content Configuration

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

### Blog Posts

```markdown
---
<!-- src/content/blog/first-post.md -->
title: "Getting Started with Astro and Nx"
description: "Learn how to build fast websites with Astro in an Nx monorepo"
pubDate: 2025-01-15
author: "John Doe"
tags: ["astro", "nx", "tutorial"]
image: "/images/blog/first-post.jpg"
---

# Getting Started

This is my first blog post using Astro content collections...

## Why Astro?

Astro is amazing because...

## Setting Up Nx

To get started with Nx...
```

### Blog List Page

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '@my-org/shared-ui/layouts/BaseLayout.astro';
import BlogCard from '../components/BlogCard.astro';

// Get all published blog posts, sorted by date
const posts = (await getCollection('blog'))
  .filter(post => !post.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<BaseLayout title="Blog" description="Read our latest posts">
  <h1>Blog</h1>

  <div class="post-grid">
    {posts.map(post => (
      <BlogCard
        title={post.data.title}
        description={post.data.description}
        pubDate={post.data.pubDate}
        author={post.data.author}
        slug={post.slug}
        image={post.data.image}
        tags={post.data.tags}
      />
    ))}
  </div>
</BaseLayout>

<style>
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }
</style>
```

### Blog Post Page

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '@my-org/shared-ui/layouts/BaseLayout.astro';
import BlogPost from '../../components/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BaseLayout
  title={post.data.title}
  description={post.data.description}
>
  <BlogPost post={post}>
    <Content />
  </BlogPost>
</BaseLayout>
```

### Blog Components

```astro
<!-- src/components/BlogCard.astro -->
---
interface Props {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  slug: string;
  image?: string;
  tags: string[];
}

const { title, description, pubDate, author, slug, image, tags } = Astro.props;

const formattedDate = pubDate.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
---

<article class="blog-card">
  <a href={`/blog/${slug}`}>
    {image && (
      <div class="blog-card__image">
        <img src={image} alt={title} />
      </div>
    )}
    <div class="blog-card__content">
      <h2>{title}</h2>
      <p class="description">{description}</p>
      <div class="meta">
        <span class="author">{author}</span>
        <span class="date">{formattedDate}</span>
      </div>
      <div class="tags">
        {tags.map(tag => (
          <span class="tag">{tag}</span>
        ))}
      </div>
    </div>
  </a>
</article>

<style>
  .blog-card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .blog-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .blog-card a {
    text-decoration: none;
    color: inherit;
  }

  .blog-card__image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .blog-card__content {
    padding: 1.5rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  .description {
    color: #6b7280;
    margin: 0 0 1rem;
  }

  .meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background: #e5e7eb;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #374151;
  }
</style>
```

### RSS Feed

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'My Blog',
    description: 'Read our latest posts',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
  });
}
```

### Workflow

```bash
# Add new post
# Create src/content/blog/new-post.md

# Generate types
npx nx sync blog

# Start dev server
npx nx dev blog

# Build for production
npx nx build blog
```

---

## SSR Application

Building a server-side rendered application with dynamic routes.

### Setup

```bash
# Create SSR app
npx nx g @geekvetica/nx-astro:application api-docs --template=minimal

# Install adapter
npm install @astrojs/node
```

### Configuration

```javascript
// apps/api-docs/astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    port: 3000,
    host: true,
  },
});
```

### API Routes

```typescript
// src/pages/api/users/[id].ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params;

  // Fetch user from database
  const user = await fetchUser(id);

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function fetchUser(id: string) {
  // Database query logic
  return { id, name: 'John Doe', email: 'john@example.com' };
}
```

### Dynamic Pages

```astro
---
// src/pages/users/[id].astro
const { id } = Astro.params;

// Fetch data on the server
const response = await fetch(`${Astro.url.origin}/api/users/${id}`);
const user = await response.json();
---

<html>
  <head>
    <title>{user.name}'s Profile</title>
  </head>
  <body>
    <h1>{user.name}</h1>
    <p>Email: {user.email}</p>
  </body>
</html>
```

### Deployment

```json
// project.json
{
  "targets": {
    "build": {
      "executor": "@geekvetica/nx-astro:build",
      "options": {
        "outputPath": "dist/apps/api-docs"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "node dist/apps/api-docs/server/entry.mjs"
      }
    }
  }
}
```

---

## Testing Strategies

Comprehensive testing examples for Astro projects.

### Unit Testing Components

```typescript
// src/components/Button.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Button from './Button.astro';

describe('Button component', () => {
  it('renders with default props', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Button, {
      slots: { default: 'Click me' },
    });

    expect(result).toContain('Click me');
    expect(result).toContain('btn--primary');
  });

  it('applies variant classes', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Button, {
      props: { variant: 'secondary' },
      slots: { default: 'Click me' },
    });

    expect(result).toContain('btn--secondary');
  });
});
```

### Testing Utilities

```typescript
// src/lib/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('January 15, 2025');
  });

  it('handles invalid dates', () => {
    expect(formatDate(null)).toBe('Invalid date');
  });
});
```

### E2E Testing

See the complete [E2E Testing Guide](./e2e-testing-guide.md) for detailed examples.

---

## CI/CD Integration

Complete CI/CD pipeline examples.

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx nx affected --target=lint

      - name: Type check
        run: npx nx affected --target=check

      - name: Test
        run: npx nx affected --target=test --coverage

      - name: Build
        run: npx nx affected --target=build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

See the complete [CI/CD Setup Guide](./ci-cd-setup.md) for more examples.

---

## Deployment Examples

### Netlify

```toml
# netlify.toml
[build]
  command = "npx nx build my-app"
  publish = "dist/apps/my-app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

```json
// vercel.json
{
  "buildCommand": "nx build my-app",
  "outputDirectory": "dist/apps/my-app",
  "framework": "astro"
}
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx build my-app

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/my-app ./
EXPOSE 3000
CMD ["node", "./server/entry.mjs"]
```

---

## Next Steps

- Review [Troubleshooting Guide](./troubleshooting.md) for common issues
- Check [API Reference](./api-reference.md) for detailed schemas
- Read [FAQ](./faq.md) for frequently asked questions
- Explore [Configuration Guide](./configuration.md) for advanced setup
