# Directory Structure

**APPLIES TO:** New feature modules, refactoring projects

**THIS DOC DESCRIBES:** How to organize files in a DDD-style frontend project

## Overall Structure

```
src/
├── core/                      # Business logic layer (DDD)
│   ├── application/           # Use case services
│   │   └── {domain}/
│   │       ├── {feature}/
│   │       └── index.ts       # Export ContainerModule
│   ├── domain/                # Core business concepts
│   │   └── {domain}/
│   │       ├── entity/        # Business entities with ID
│   │       ├── vo/            # Value objects (stateless)
│   │       ├── contract/      # Platform-agnostic interfaces
│   │       └── utils/         # Business utilities
│   ├── infra/                 # Infrastructure interfaces
│   │   ├── {service}.contract.ts
│   │   └── index.ts
│   └── platform-related/      # Platform implementations
│       └── {platform}/
│           ├── bootstrap.ts   # Container setup
│           ├── infra/         # Infra implementations
│           └── export/        # Service exports
├── pages/                     # Page components
│   └── {feature}/
│       ├── components/        # Pure UI components
│       ├── store/             # MobX stores
│       │   ├── modules/       # Store modules
│       │   └── index.tsx      # Provider setup
│       └── index.tsx          # Page entry
├── components/                # Shared UI components
└── material/                  # Atomic UI elements
```

## Core Layer Details

### domain/ Structure

```
domain/{feature}/
├── entity/
│   ├── {feature}.entity.ts      # Main entity
│   └── types.ts                 # Entity-related types
├── vo/
│   ├── {feature}.vo.ts          # Value objects
│   └── types.ts                 # VO-related types
├── contract/
│   ├── {feature}-service.contract.ts
│   └── types.ts
└── utils/
    └── {feature}.utils.ts       # Pure business logic
```

### application/ Structure

```
application/{feature}/
├── {feature}-service.ts         # Main service
├── {sub-feature}-service.ts     # Sub-feature services
└── index.ts                     # ContainerModule export
```

### infra/ Structure

```
infra/
├── {service}.contract.ts        # Interface definitions
├── {service}-types.ts
└── index.ts                     # Symbol exports
```

### platform-related/ Structure

```
platform-related/{platform}/
├── bootstrap.ts                 # Load modules into container
├── infra/
│   └── {service}.ts             # Platform implementation
├── export/
│   └── {service}.ts             # Export from container
└── {feature}/                   # Platform-specific feature impl
```

## Page Layer Structure

```
pages/{feature}/
├── components/
│   ├── {sub-component}/
│   │   ├── index.tsx
│   │   ├── {sub-component}.tsx
│   │   └── types.ts
│   └── index.ts                 # Barrel export
├── store/
│   ├── modules/
│   │   ├── root.ts              # Root store
│   │   ├── {feature}.ts         # Domain store
│   │   ├── ui.ts                # UI state store
│   │   └── deps.ts              # Dependencies
│   └── index.tsx                # Provider + hooks export
└── index.tsx                    # Page entry
```

## Example: Campaign Feature

```
src/core/domain/campaign/
├── entity/
│   ├── campaign.entity.ts
│   ├── com-campaign.entity.ts
│   └── parent-campaign.entity.ts
├── vo/
│   ├── campaign-types.vo.ts
│   └── campaign-status.vo.ts
├── contract/
│   ├── campaign-service.contract.ts
│   └── types.ts
└── utils/
    └── campaign.utils.ts

src/core/application/campaign/
├── campaign-list.service.ts
├── campaign-register.service.ts
├── agreement.service.ts
└── index.ts                     # CampaignApplicationServiceModule

src/pages/OneLinkRegistration/
├── components/
│   ├── ParentCampaignInfo/
│   ├── SelectCampaign/
│   └── TncTips/
├── store/
│   ├── modules/
│   │   ├── root.ts
│   │   ├── parent-campaign.ts
│   │   ├── com-campaign.ts
│   │   ├── registration.ts
│   │   └── deps.ts
│   └── index.tsx
└── index.tsx
```

## Key Principles

1. **Domain layer is framework-agnostic** - No React, MobX, or Inversify imports
2. **Application layer uses DI** - Inversify decorators for service injection
3. **Platform layer is isolated** - Separate implementations per platform
4. **Page layer connects UI** - MobX stores coordinate services and state
5. **Components are pure** - UI only, no business logic
