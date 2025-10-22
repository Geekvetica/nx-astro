# Documentation Index

Welcome to the `@geekvetica/nx-astro` documentation. This index provides a comprehensive guide to all available documentation organized by category.

## Quick Start

- [Main README](../README.md) - Project overview, installation, and quick start guide

## User Guides

Documentation for developers using the `@geekvetica/nx-astro` plugin in their projects.

### Getting Started

- [Installation](../README.md#installation) - How to install the plugin
- [Usage](../README.md#usage) - Basic usage instructions
- [Examples](./examples.md) - Real-world usage examples

### Core Features

- [Monorepo Compatibility](./MONOREPO-COMPATIBILITY.md) - **NEW** Automatic dependency management for Astro in monorepos
  - Problem and solution overview
  - How it works (auto-generate and auto-sync)
  - Technical details and architecture
  - Troubleshooting guide
  - Real-world examples

- [Generators](./generators.md) - Code generation tools for Astro projects
  - Application generator
  - Library generator
  - Component generator
  - Configuration generator
  - Preset generator

- [Executors](./executors.md) - Task execution tools for Astro projects
  - Build executor
  - Dev server executor
  - Preview executor
  - Check executor
  - Sync executor
  - Test executor

- [Configuration](./configuration.md) - Configuration options and customization
  - Project configuration
  - Workspace configuration
  - Plugin options
  - Astro configuration integration

### Testing

- [E2E Testing Guide](./e2e-testing-guide.md) - End-to-end testing with Playwright and Cypress
  - Setting up E2E tests
  - Writing tests
  - Running tests
  - Best practices

### Deployment & CI/CD

- [CI/CD Setup Guide](./ci-cd-setup.md) - Continuous integration and deployment for plugin development
  - GitHub Actions configuration
  - CI pipeline architecture
  - Release automation
  - Best practices

- [Consuming Project CI Guide](./consuming-project-ci.md) - CI/CD for projects using `@geekvetica/nx-astro`
  - Setting up CI for Astro applications
  - Caching strategies
  - Deployment workflows
  - Example configurations

### Troubleshooting & Support

- [FAQ](./faq.md) - Frequently asked questions
  - Common issues
  - Best practices
  - Performance optimization

- [Troubleshooting](./troubleshooting.md) - Troubleshooting common issues
  - Installation problems
  - Build errors
  - Runtime issues
  - Development environment issues

- [Migration Guide](./migration-guide.md) - Migrating between versions
  - Breaking changes
  - Upgrade instructions
  - Deprecation notices

## Reference Documentation

Technical reference documentation for advanced users.

### API Documentation

- [API Reference](./api-reference.md) - Complete API documentation
  - Generator APIs
  - Executor APIs
  - Utility functions
  - Type definitions

### Architecture

- [Architecture Overview](./architecture.md) - Plugin architecture and design
  - System architecture
  - Component design
  - Integration patterns
  - Design decisions

- [Architecture Summary](./architecture-summary.md) - Quick architecture overview
  - High-level design
  - Key components
  - Data flow

## Maintainer Documentation

Documentation for maintainers and core contributors of the `@geekvetica/nx-astro` plugin.

### Getting Started as a Maintainer

- [Development Setup](./maintenance/development-setup.md) - Set up development environment
  - Prerequisites
  - Repository setup
  - Building and testing
  - Development workflow
  - Common tasks

- [Project Structure](./maintenance/project-structure.md) - Internal project organization
  - Directory layout
  - Package structure
  - Build system
  - Testing infrastructure
  - CI/CD configuration

### Release Management

- [Release Process](./maintenance/release-process.md) - Release procedures and automation
  - How to trigger releases
  - Release workflow details
  - Version management
  - Publishing process
  - Post-release validation
  - Rollback procedures

### Contributing

- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute to the project
  - Code of conduct
  - Development workflow
  - Testing requirements
  - Coding standards
  - Pull request process

- [Release Checklist](../RELEASE-CHECKLIST.md) - Pre-release validation checklist
  - Code quality verification
  - Documentation updates
  - Testing requirements
  - Release steps

## Additional Resources

### External Documentation

- [Nx Documentation](https://nx.dev) - Official Nx documentation
- [Astro Documentation](https://docs.astro.build) - Official Astro documentation
- [Nx Plugin API](https://nx.dev/extending-nx/intro/getting-started) - Creating Nx plugins
- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/) - Astro integrations

### Community

- [GitHub Repository](https://github.com/geekvetica/nx-astro) - Source code and issues
- [GitHub Issues](https://github.com/geekvetica/nx-astro/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions) - Questions and discussions
- [npm Package](https://www.npmjs.com/package/@geekvetica/nx-astro) - Published package

### Support Channels

- **Bug Reports**: Open an issue on [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)
- **Feature Requests**: Open an issue with the enhancement label
- **Questions**: Ask in [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)
- **General Nx Help**: Join the [Nx Discord](https://go.nx.dev/community)
- **General Astro Help**: Join the [Astro Discord](https://astro.build/chat)

## Documentation by Use Case

### I want to use nx-astro in my project

1. Start with the [Main README](../README.md)
2. Follow the [Installation](../README.md#installation) guide
3. Review [Generators](./generators.md) to create projects
4. Learn about [Executors](./executors.md) to run tasks
5. Check [Examples](./examples.md) for real-world usage
6. Set up [CI/CD](./consuming-project-ci.md) for your project

### I want to contribute to nx-astro

1. Read the [Contributing Guidelines](../CONTRIBUTING.md)
2. Set up your [Development Environment](./maintenance/development-setup.md)
3. Understand the [Project Structure](./maintenance/project-structure.md)
4. Review the [Architecture](./architecture.md)
5. Check the [API Reference](./api-reference.md)

### I want to maintain/release nx-astro

1. Ensure you have [Development Setup](./maintenance/development-setup.md) complete
2. Understand the [Project Structure](./maintenance/project-structure.md)
3. Follow the [Release Process](./maintenance/release-process.md)
4. Use the [Release Checklist](../RELEASE-CHECKLIST.md)
5. Monitor [CI/CD pipelines](./ci-cd-setup.md)

### I'm having issues

1. Check the [FAQ](./faq.md) for common questions
2. Review [Troubleshooting](./troubleshooting.md) for solutions
3. Search [GitHub Issues](https://github.com/geekvetica/nx-astro/issues)
4. Ask in [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)

### I need technical details

1. Review [API Reference](./api-reference.md)
2. Study [Architecture](./architecture.md)
3. Check [Configuration](./configuration.md)
4. Explore [Project Structure](./maintenance/project-structure.md)

## Documentation Updates

This documentation is maintained alongside the codebase. To suggest improvements:

1. Open an issue with the `documentation` label
2. Submit a pull request with documentation changes
3. Discuss in [GitHub Discussions](https://github.com/geekvetica/nx-astro/discussions)

## Documentation Standards

All documentation follows these standards:

- **Markdown Format**: All docs use Markdown
- **Clear Headings**: Hierarchical structure with descriptive headings
- **Code Examples**: Include runnable code examples
- **Up-to-date**: Kept current with latest plugin version
- **Accessible**: Clear language for all skill levels
- **Searchable**: Descriptive keywords and cross-references

## License

This documentation is part of the `@geekvetica/nx-astro` project and is licensed under the [MIT License](../LICENSE).

---

**Last Updated**: 2025-10-12

**Plugin Version**: 1.0.0

**Maintained by**: Geekvetica Paweł Wojciechowski
