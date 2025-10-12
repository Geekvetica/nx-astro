# Generators

Generators in the nx-astro plugin help you create and configure Astro projects and components within your Nx workspace. This guide covers all available generators with detailed usage examples.

## Overview

The nx-astro plugin provides three generators:

- **init** - Initialize the plugin in your workspace
- **application** - Create or import an Astro application
- **component** - Generate an Astro component

## Init Generator

The init generator sets up the nx-astro plugin in your Nx workspace by registering the plugin and installing required dependencies.

### Purpose

Use this generator when you first add the nx-astro plugin to your workspace. It ensures all necessary dependencies are installed and the plugin is properly configured.

### Usage

```bash
nx g @geekvetica/nx-astro:init
```

### Options

| Option            | Type      | Default | Description                                    |
| ----------------- | --------- | ------- | ---------------------------------------------- |
| `skipPackageJson` | `boolean` | `false` | Skip adding Astro dependencies to package.json |

### What Gets Generated

The init generator:

1. Registers the nx-astro plugin in `nx.json` under the `plugins` array
2. Adds `astro` to your package.json dependencies (unless `skipPackageJson` is true)
3. Ensures the plugin is ready to detect Astro projects automatically

### Example

```bash
# Standard initialization
nx g @geekvetica/nx-astro:init

# Skip package.json updates (if dependencies already installed)
nx g @geekvetica/nx-astro:init --skipPackageJson
```

### When to Use

- First time setting up nx-astro in your workspace
- After adding the nx-astro package to your project
- Before creating your first Astro application

---

## Application Generator

The application generator creates a new Astro application or imports an existing one into your Nx workspace.

### Purpose

Use this generator to:

- Create a new Astro application from scratch using a template
- Import an existing Astro project into your Nx monorepo
- Set up project configuration with automatically inferred tasks

### Usage

```bash
# Create a new application
nx g @geekvetica/nx-astro:application my-app

# Import an existing project
nx g @geekvetica/nx-astro:application my-app --importExisting
```

### Options

| Option           | Type      | Default     | Description                                                                                                       |
| ---------------- | --------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`           | `string`  | -           | **Required.** Application name (must start with a letter and contain only alphanumeric characters and hyphens)    |
| `directory`      | `string`  | -           | Directory where the application will be placed (e.g., 'apps/my-app'). If not provided, uses workspace conventions |
| `tags`           | `string`  | -           | Tags to add to the project (comma-separated, e.g., 'frontend,astro,public')                                       |
| `importExisting` | `boolean` | `false`     | Import an existing Astro project into the workspace                                                               |
| `template`       | `string`  | `"minimal"` | Starter template to use: `minimal`, `blog`, or `portfolio`                                                        |
| `skipFormat`     | `boolean` | `false`     | Skip formatting files after generation                                                                            |

### Templates

The generator provides three starter templates:

#### Minimal Template

A basic starter with essential files:

- Basic homepage
- Minimal configuration
- Ready for customization

#### Blog Template

A blog-ready starter with:

- Content collections for blog posts
- Layout components
- Example blog posts
- RSS feed setup

#### Portfolio Template

A portfolio starter with:

- Project showcase layout
- About page
- Responsive design
- Image optimization examples

### Generated Files

When creating a new application with the **minimal** template:

```
apps/my-app/
├── src/
│   ├── pages/
│   │   └── index.astro          # Homepage
│   ├── components/               # Component directory
│   └── layouts/                  # Layout directory
├── public/                       # Static assets
│   └── favicon.svg
├── astro.config.mjs              # Astro configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies (if standalone)
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

The **blog** template includes additional files:

```
apps/my-app/
└── src/
    ├── content/
    │   ├── config.ts             # Content collections schema
    │   └── blog/                 # Blog posts
    ├── components/
    │   └── BlogPost.astro        # Blog post component
    └── pages/
        ├── blog/
        │   └── [...slug].astro   # Dynamic blog routes
        └── rss.xml.ts            # RSS feed
```

The **portfolio** template includes:

```
apps/my-app/
└── src/
    ├── pages/
    │   ├── index.astro           # Homepage with projects
    │   ├── about.astro           # About page
    │   └── projects/
    │       └── [slug].astro      # Project detail pages
    └── components/
        ├── ProjectCard.astro     # Project card component
        └── Hero.astro            # Hero component
```

### Project Configuration

The generator automatically configures the project in `project.json` or workspace configuration with inferred tasks:

```json
{
  "name": "my-app",
  "sourceRoot": "apps/my-app/src",
  "projectType": "application",
  "tags": ["frontend", "astro"]
}
```

Tasks are automatically inferred by the plugin when it detects `astro.config.mjs`:

- `dev` - Development server
- `build` - Production build
- `preview` - Preview built site
- `check` - Type checking
- `sync` - Generate types for content collections

### Usage Examples

#### Create a Basic Application

```bash
# Creates a minimal Astro app in apps/my-app
nx g @geekvetica/nx-astro:application my-app

# Same as above (minimal is default)
nx g @geekvetica/nx-astro:application my-app --template=minimal
```

#### Create a Blog

```bash
# Creates a blog application with content collections
nx g @geekvetica/nx-astro:application my-blog --template=blog

# Add tags for organization
nx g @geekvetica/nx-astro:application my-blog --template=blog --tags="frontend,blog,content"
```

#### Create a Portfolio

```bash
# Creates a portfolio application
nx g @geekvetica/nx-astro:application portfolio --template=portfolio --tags="frontend,marketing"
```

#### Custom Directory Structure

```bash
# Place app in a specific directory
nx g @geekvetica/nx-astro:application marketing-site --directory=apps/websites/marketing

# This creates: apps/websites/marketing/
```

#### Import Existing Project

```bash
# Import an existing Astro project
nx g @geekvetica/nx-astro:application legacy-site --importExisting

# The generator will prompt you for the existing project location
# or copy files from the current directory if the project is already in place
```

### After Generation

Once the application is generated, you can:

```bash
# Start development server
nx dev my-app

# Build for production
nx build my-app

# Preview the built site
nx preview my-app

# Run type checking
nx check my-app

# Generate types for content collections (if using blog template)
nx sync my-app
```

### Tips and Best Practices

1. **Use Tags for Organization**

   - Add meaningful tags to help organize large monorepos
   - Example: `--tags="frontend,public-facing,marketing"`

2. **Choose the Right Template**

   - Start with `minimal` for maximum flexibility
   - Use `blog` if you're building a content-heavy site
   - Use `portfolio` for project showcases

3. **Directory Structure**

   - Keep related apps together using the `directory` option
   - Follow a consistent naming convention across your monorepo

4. **Importing Existing Projects**

   - Ensure your existing project has an `astro.config.mjs` file
   - Back up your project before importing
   - Review generated configuration after import

5. **Monorepo Benefits**
   - Share components across multiple Astro apps
   - Use Nx caching for faster builds
   - Leverage dependency graph for impact analysis

---

## Component Generator

The component generator creates Astro components with consistent structure and optional exports.

### Purpose

Use this generator to:

- Create new Astro components with proper naming and location
- Maintain consistent component structure across your project
- Automatically export components from index files

### Usage

```bash
# Create a component in the default components directory
nx g @geekvetica/nx-astro:component Button --project=my-app

# Create a component in a subdirectory
nx g @geekvetica/nx-astro:component Button --project=my-app --directory=ui
```

### Options

| Option       | Type      | Default | Description                                                                                                     |
| ------------ | --------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `name`       | `string`  | -       | **Required.** Component name (must start with a letter, can contain letters, numbers, hyphens, and underscores) |
| `project`    | `string`  | -       | **Required.** The name of the Astro project where the component will be created                                 |
| `directory`  | `string`  | -       | Directory path within `src/components` (e.g., 'ui', 'forms', 'ui/buttons')                                      |
| `export`     | `boolean` | `false` | Add an export to `src/components/index.ts` for easy importing                                                   |
| `skipFormat` | `boolean` | `false` | Skip formatting files after generation                                                                          |

### Generated Files

The generator creates a single `.astro` file with a basic component structure:

```astro
---
// Component props interface
interface Props {
  // Add your props here
}

const {} = Astro.props;
---

<div>
  <!-- Component content -->
</div>

<style>
  /* Component styles */
</style>
```

### File Location

Components are created in the `src/components` directory of the target project:

```bash
# Without directory option
nx g @geekvetica/nx-astro:component Card --project=my-app
# Creates: apps/my-app/src/components/Card.astro

# With directory option
nx g @geekvetica/nx-astro:component Card --project=my-app --directory=ui
# Creates: apps/my-app/src/components/ui/Card.astro

# Nested directory
nx g @geekvetica/nx-astro:component PrimaryButton --project=my-app --directory=ui/buttons
# Creates: apps/my-app/src/components/ui/buttons/PrimaryButton.astro
```

### Usage Examples

#### Create a Simple Component

```bash
# Create a basic component
nx g @geekvetica/nx-astro:component Hero --project=my-app
```

Creates `src/components/Hero.astro`:

```astro
---
interface Props {
  // Add your props here
}

const {} = Astro.props;
---

<div>
  <!-- Component content -->
</div>

<style>
  /* Component styles */
</style>
```

#### Organize Components by Category

```bash
# UI components
nx g @geekvetica/nx-astro:component Button --project=my-app --directory=ui
nx g @geekvetica/nx-astro:component Card --project=my-app --directory=ui
nx g @geekvetica/nx-astro:component Modal --project=my-app --directory=ui

# Form components
nx g @geekvetica/nx-astro:component Input --project=my-app --directory=forms
nx g @geekvetica/nx-astro:component Select --project=my-app --directory=forms

# Layout components
nx g @geekvetica/nx-astro:component Header --project=my-app --directory=layout
nx g @geekvetica/nx-astro:component Footer --project=my-app --directory=layout
```

#### Create and Export Component

```bash
# Create component and add export to index.ts
nx g @geekvetica/nx-astro:component Button --project=my-app --export

# Now you can import like this:
# import { Button } from '../components';
```

When using `--export`, the generator creates or updates `src/components/index.ts`:

```typescript
export { default as Button } from './Button.astro';
```

#### Nested Component Structure

```bash
# Create deeply nested components
nx g @geekvetica/nx-astro:component PrimaryButton --project=my-app --directory=ui/buttons
nx g @geekvetica/nx-astro:component SecondaryButton --project=my-app --directory=ui/buttons
nx g @geekvetica/nx-astro:component IconButton --project=my-app --directory=ui/buttons

# Result:
# src/components/ui/buttons/PrimaryButton.astro
# src/components/ui/buttons/SecondaryButton.astro
# src/components/ui/buttons/IconButton.astro
```

### Component Naming Conventions

The generator follows Astro's naming conventions:

- **PascalCase**: Component names should use PascalCase (e.g., `MyComponent`, not `myComponent` or `my-component`)
- **File Extension**: Always uses `.astro` extension
- **Descriptive Names**: Use clear, descriptive names that indicate the component's purpose

```bash
# Good examples
nx g @geekvetica/nx-astro:component BlogPostCard --project=my-app
nx g @geekvetica/nx-astro:component NavigationMenu --project=my-app
nx g @geekvetica/nx-astro:component UserProfile --project=my-app

# Valid but less clear
nx g @geekvetica/nx-astro:component Card --project=my-app
nx g @geekvetica/nx-astro:component Menu --project=my-app
```

### Working with Generated Components

After generating a component, you can customize it:

1. **Add Props**

   ```astro
   ---
   interface Props {
     title: string;
     description?: string;
     variant?: 'primary' | 'secondary';
   }

   const { title, description, variant = 'primary' } = Astro.props;
   ---

   <div class={`card card--${variant}`}>
     <h2>{title}</h2>
     {description && <p>{description}</p>}
   </div>
   ```

2. **Add Slots**

   ```astro
   ---
   interface Props {
     title: string;
   }

   const { title } = Astro.props;
   ---

   <div class="container">
     <h2>{title}</h2>
     <slot />
   </div>
   ```

3. **Import and Use**

   ```astro
   ---
   import Card from '../components/ui/Card.astro';
   ---

   <Card title="Hello World" variant="primary">
     <p>Card content goes here</p>
   </Card>
   ```

### Tips and Best Practices

1. **Organize by Feature or Type**

   - Group related components together using the `directory` option
   - Consider directories like `ui`, `forms`, `layout`, `features`

2. **Use Consistent Naming**

   - Follow PascalCase for all component names
   - Use descriptive names that indicate purpose

3. **Leverage Exports**

   - Use `--export` for frequently used components
   - Create a component library pattern with barrel exports

4. **Component Structure**

   - Keep components focused on a single responsibility
   - Extract complex logic into separate utility files
   - Use TypeScript interfaces for type-safe props

5. **Reusability**
   - Design components to be reusable across pages
   - Use props and slots for flexibility
   - Consider creating a shared component library for multiple apps

### Multiple Projects

When working with multiple Astro applications in your monorepo:

```bash
# Create components in different projects
nx g @geekvetica/nx-astro:component Header --project=marketing-site
nx g @geekvetica/nx-astro:component Header --project=blog

# Share components by creating a library
# (Consider using @nx/js:library for shared components)
```

---

## Common Workflows

### Starting a New Project

```bash
# 1. Initialize the plugin (first time only)
nx g @geekvetica/nx-astro:init

# 2. Create your application
nx g @geekvetica/nx-astro:application my-app --template=minimal

# 3. Start development
nx dev my-app
```

### Setting Up a Blog

```bash
# 1. Create blog application
nx g @geekvetica/nx-astro:application my-blog --template=blog --tags="content,blog"

# 2. Generate additional components
nx g @geekvetica/nx-astro:component BlogCard --project=my-blog --directory=blog --export
nx g @geekvetica/nx-astro:component AuthorBio --project=my-blog --directory=blog --export

# 3. Generate content collection types
nx sync my-blog

# 4. Start development
nx dev my-blog
```

### Building a Multi-App Site

```bash
# 1. Create main marketing site
nx g @geekvetica/nx-astro:application marketing --directory=apps/sites --tags="public,marketing"

# 2. Create blog
nx g @geekvetica/nx-astro:application blog --directory=apps/sites --template=blog --tags="public,content"

# 3. Create shared components
nx g @geekvetica/nx-astro:component Button --project=marketing --directory=ui --export
nx g @geekvetica/nx-astro:component Card --project=marketing --directory=ui --export

# 4. Build all sites
nx run-many --target=build --all
```

### Importing an Existing Project

```bash
# 1. Ensure plugin is initialized
nx g @geekvetica/nx-astro:init

# 2. Import the project
nx g @geekvetica/nx-astro:application existing-site --importExisting

# 3. Verify the import worked
nx build existing-site

# 4. Add components as needed
nx g @geekvetica/nx-astro:component NewFeature --project=existing-site
```

---

## Next Steps

- Learn about [Executors](./executors.md) to run development servers, builds, and more
- Configure your projects with the [Configuration Guide](./configuration.md)
- Explore [Examples](./examples.md) for real-world usage patterns
- See the [API Reference](./api-reference.md) for complete schema documentation
