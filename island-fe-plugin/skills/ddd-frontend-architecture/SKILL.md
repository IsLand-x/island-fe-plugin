---
name: ddd-frontend-architecture
description: Domain-Driven Design (DDD) architecture patterns for large-scale frontend applications with dependency injection (Inversify) and MobX state management. Use this skill when designing or refactoring complex frontend applications, organizing business logic, handling multi-platform code sharing, or building maintainable enterprise applications.
---

# DDD Frontend Architecture

**Before codegen / review / architecture design, MUST LOAD AND FOLLOW ALL THE REFERENCES.**

> **Important:** DDD is not a silver bullet. This architecture introduces additional complexity (layers, DI, entities, etc.) that may be overkill for simple pages or short-lived projects. Choose this approach based on project complexity and longevity.

## When to Use This Skill

This skill is designed for **long-term, complex enterprise applications**. Consider DDD when:

| Scenario                   | Description                                                                    |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Existing DDD Project**   | The codebase already follows DDD patterns and you need to maintain consistency |
| **Long-term Iterations**   | Project will have ongoing development for months/years                         |
| **Early-stage Project**    | Starting fresh with plans for long-term maintenance                            |
| **Multi-platform Needs**   | Code needs to run on PC, Mobile, Lynx, etc.                                    |
| **Complex Business Logic** | Significant business rules that benefit from encapsulation                     |

**Recommended for:** Backend management systems, admin panels, enterprise dashboards

**Not recommended for:**

- Simple landing pages or marketing sites
- Short-lived prototype projects
- Pages with minimal business logic (< 100 lines of state management)
- Projects with no plans for long-term maintenance

## Architecture Principles

| Principle              | Description                                   |
| ---------------------- | --------------------------------------------- |
| Separation of Concerns | Business logic independent of UI frameworks   |
| Platform Agnosticism   | Core code works across PC, Mobile, Lynx, etc. |
| Testability            | Services can be easily mocked and tested      |
| Maintainability        | Clear boundaries and single responsibilities  |

## Core Layers

```
src/
├── core/              # Business logic (DDD)
│   ├── application/   # Use case orchestration
│   ├── domain/        # Entities, Value Objects, Contracts
│   ├── infra/         # Infrastructure interfaces
│   └── platform-related/ # Platform implementations
├── pages/             # Page components with stores
└── components/        # Reusable UI components
```

## Key Patterns

| Pattern            | Purpose                               |
| ------------------ | ------------------------------------- |
| Entity             | Business data with ID, business rules |
| ValueObject        | Stateless reusable logic, no ID       |
| ApplicationService | Orchestrate domain objects            |
| Contract/Interface | Platform-agnostic APIs                |
| PlatformImpl       | Platform-specific implementations     |
| MobX Store         | UI state coordination                 |

## Usage Scenarios

Use this skill when:

- Building new enterprise feature modules
- Refactoring legacy code into maintainable structure
- Sharing code across PC/Mobile/Lynx platforms
- Designing complex business workflows
- Creating testable business logic layers

## Reference Documents

### Architecture Fundamentals

- [Directory Structure](./references/directory-structure.md)
- [Core Layer Organization](./references/core-layers.md)

### Domain Design

- [Entity Design Patterns](./references/entity-vo-design.md)
- [Value Object Patterns](./references/entity-vo-design.md#value-objects)

### Dependency Injection

- [Inversify Setup](./references/inversify-di.md)
- [Platform Abstraction](./references/platform-abstraction.md)

### State Management

- [MobX Store Architecture](./references/mobx-store-architecture.md)
- [Store Module Patterns](./references/mobx-store-architecture.md#store-modules)

### UI Components

- [Renderer Pattern](./references/ui-component-patterns.md)
- [Component Organization](./references/ui-component-patterns.md#component-organization)

## Dependencies

```json
{
  "mobx": "^6.0.0",
  "mobx-react-lite": "^3.0.0",
  "inversify": "^6.0.0",
  "reflect-metadata": "^0.1.0"
}
```

## Related Skills

- [mobx-react-best-practices](./mobx-react-best-practices) - Detailed MobX + React patterns
