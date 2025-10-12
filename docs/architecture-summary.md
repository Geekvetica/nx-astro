# Nx-Astro Plugin Architecture Summary

## Key Design Decisions

### 1. Plugin Structure

- **Modular organization**: Separate directories for generators, executors, utils
- **Schema-driven**: JSON schemas with TypeScript definitions for all generators/executors
- **Template-based generation**: File templates with substitution patterns

### 2. Task Inference Strategy

- **Zero-configuration** approach using `createNodesV2`
- **Automatic detection** via `astro.config.mjs` glob pattern
- **Smart defaults** with override capabilities in `nx.json`

### 3. Executor Design

- **Thin wrapper** over Astro CLI commands
- **Preservation** of native Astro capabilities
- **Enhanced** with Nx caching and dependency management

### 4. Caching Strategy

- **Build task**: Fully cached based on inputs
- **Check task**: Cached for type checking
- **Sync task**: Cached for type generation
- **Test task**: Cached with coverage output
- **Dev/Preview**: Never cached (interactive tasks)

### 5. Dependency Management

- **Automatic detection** from imports and package.json
- **Task orchestration** with topological ordering
- **Support** for shared component libraries

## Implementation Phases

### Stage 1: Architecture & Planning ✓

- **Status**: Complete
- **Deliverable**: Architecture document
- **Next**: Foundation implementation

### Stage 2: Foundation & Infrastructure

**Subagent**: Infrastructure Developer

- Create plugin file structure
- Implement core utilities (config parser, AST utils)
- Set up TypeScript types
- Establish testing framework

### Stage 3: Plugin Core (createNodesV2)

**Subagent**: Plugin Core Developer

- Implement createNodesV2 function
- Create task inference logic
- Set up project graph integration
- Configure caching strategies

### Stage 4: Generators

**Subagent**: Generator Developer

- Implement init generator
- Implement application generator
- Implement component generator
- Create all template files

### Stage 5: Executors

**Subagent**: Executor Developer

- Implement all 6 executors (dev, build, preview, check, test, sync)
- Add error handling and logging
- Create executor tests

### Stage 6: Testing & Documentation

**Subagent**: QA & Documentation Engineer

- Complete E2E test suite
- Write user documentation
- Create example projects
- Performance testing

## Critical Path Items

1. **Config Parser**: Essential for all functionality
2. **createNodesV2**: Core of the plugin
3. **Build Executor**: Most important executor
4. **Application Generator**: Primary generator

## Technology Stack

- **Language**: TypeScript
- **Build**: @nx/js:tsc
- **Testing**: Jest + @nx/jest
- **Package Manager**: pnpm
- **Target Node**: 18.x+
- **Nx Version**: 21.6.4

## Key Files to Create

### Immediate Priority

1. `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/plugin.ts` - createNodesV2 implementation
2. `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/utils/astro-config.ts` - Config parser
3. `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/utils/types.ts` - TypeScript definitions
4. `/Users/pwojciechowski/_dev/nx-astro/nx-astro/generators.json` - Generator registry
5. `/Users/pwojciechowski/_dev/nx-astro/nx-astro/executors.json` - Executor registry

### Generator Files

- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/generators/init/init.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/generators/application/application.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/generators/component/component.ts`

### Executor Files

- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/dev/dev.impl.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/build/build.impl.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/preview/preview.impl.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/check/check.impl.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/test/test.impl.ts`
- `/Users/pwojciechowski/_dev/nx-astro/nx-astro/src/executors/sync/sync.impl.ts`

## Success Criteria

1. **Automatic task discovery** works without configuration
2. **All Astro CLI commands** are supported
3. **Caching improves** build performance by >50%
4. **Generator creates** working Astro applications
5. **Integration** with Nx graph visualization
6. **Cross-platform** compatibility (Windows, Mac, Linux)

## Risk Mitigation

### High Priority Risks

1. **Astro config parsing**: Use AST with regex fallback
2. **Version compatibility**: Support matrix for Astro 3.x and 4.x
3. **Performance**: Aggressive caching of parsed configs

### Medium Priority Risks

1. **Integration conflicts**: Document known issues
2. **Complex configurations**: Provide manual override options
3. **Error handling**: Clear, actionable error messages

## Estimated Timeline

- **Total Duration**: 15-20 days
- **Stage 2 (Foundation)**: 2-3 days
- **Stage 3 (Plugin Core)**: 3-4 days
- **Stage 4 (Generators)**: 4-5 days
- **Stage 5 (Executors)**: 4-5 days
- **Stage 6 (Testing/Docs)**: 2-3 days

## Next Actions

1. Review and approve architecture document
2. Assign subagents to stages 2-6
3. Begin Stage 2 implementation (Foundation)
4. Set up CI/CD pipeline for testing
5. Create project board for tracking progress
