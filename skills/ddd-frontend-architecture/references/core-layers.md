# Core Layers Organization

**APPLIES TO:** All DDD-style feature modules

**THIS DOC DESCRIBES:** Responsibilities and organization of each layer

## Layer Hierarchy

```
┌─────────────────────────────────────┐
│           pages/                    │  UI Layer (React)
│  Components + MobX Stores           │
├─────────────────────────────────────┤
│           core/                     │  Business Logic Layer
│  application/ + domain/ + infra/    │
├─────────────────────────────────────┤
│      platform-related/              │  Platform Adaptation
│      (PC / Mobile / Lynx)           │
└─────────────────────────────────────┘
```

## Domain Layer

**Responsibility:** Define business entities, rules, and pure logic

### Characteristics
- Framework-agnostic (no React, MobX, Inversify)
- Pure TypeScript/JavaScript
- Contains business knowledge only

### Entity (实体)

```typescript
// domain/campaign/entity/com-campaign.entity.ts
import type { ComCampaign } from '@/types/campaign';

export default class ComCampaignEntity {
  constructor(private data: ComCampaign) {}

  // Business rule: Can this campaign be registered?
  get canRegister() {
    return (
      this.data.status === CampaignStatus.ACTIVE &&
      !this.data.isExpired &&
      this.data.remainingQuota > 0
    );
  }

  // Business rule: Campaign type classification
  get campaignTypes() {
    return new CampaignTypesVO({
      comCampaignSingleTypes: this.data.comCampaignSingleTypes,
      registerTypes: this.data.registerTypes,
    });
  }

  // Business rule: Display name
  get displayName() {
    return this.data.displayName || this.data.name;
  }
}
```

**Key Points:**
- Has business ID (unique identifier)
- "Anemic model" - data transformation via getters
- Encapsulates business rules
- Returns other VO instances for composed logic

### Value Object (值对象)

```typescript
// domain/campaign/vo/campaign-types.vo.ts
export default class CampaignTypesVO {
  constructor(private params: CampaignTypesParams) {}

  get isCFVCampaign() {
    return this.params.comCampaignSingleTypes?.includes(
      ComCampaignSingleType.ComCampaignSingleType_PRODUCT_CO_FUND
    );
  }

  get isAMSOrBNPLCampaign() {
    return (
      this.isAMSShopCampaign ||
      this.isAMSProductCampaign ||
      this.isBNPLShopCampaign ||
      this.isBNPLProductCampaign
    );
  }

  get requiresProducts() {
    return this.isCFVCampaign || this.hasRecommendedProducts;
  }
}
```

**Key Points:**
- No business ID (stateless)
- Reusable across multiple entities
- Encapsulates reusable判断逻辑
- Immutable, created on-demand

### Contract (契约)

```typescript
// domain/campaign/contract/campaign-service.contract.ts
export interface CampaignUIService {
  showServiceFeeModal(params: ServiceFeeModalParams): Promise<{ isAccepted: boolean }>;
  showAgreementModal(params: AgreementModalParams): Promise<void>;
  showProductDrawer(params: ProductDrawerParams): void;
}

export const CampaignDomainService = {
  CampaignUIService: Symbol.for('CampaignUIService'),
};
```

**Key Points:**
- Defines business semantics (what to do)
- Platform-agnostic interface
- Hides implementation details

## Application Layer

**Responsibility:** Orchestrate domain objects, coordinate use cases

### Characteristics
- Uses Inversify DI (`@injectable`, `@inject`)
- Manages service lifecycle (usually singleton)
- Coordinates between domain entities and infra

### Service Implementation

```typescript
// application/campaign/campaign-register.service.ts
import { inject, injectable } from 'inversify';
import type { CampaignSellerBackendAPI } from '@/core/infra/campaign-seller-backend.contract';
import type { ToastService } from '@/core/infra/toast-service.contract';
import { InfraModuleType } from '@/core/infra';
import type { ComCampaignEntity } from '@/domain/campaign/entity/com-campaign.entity';

@injectable()
export default class CampaignRegisterService {
  constructor(
    @inject(InfraModuleType.CampaignSellerBackendAPI)
    private api: CampaignSellerBackendAPI,
    @inject(InfraModuleType.ToastService)
    private toastService: ToastService,
  ) {}

  async listRegisterableCampaigns(request: ListCampaignRequest) {
    const res = await this.api.ListOneLinkComCampaigns(request);
    return {
      ...res,
      data: {
        ...res.data,
        com_campaign_info_list: res.data?.com_campaign_info_list?.map(
          (info) => new ComCampaignEntity(info),
        ),
      },
    };
  }

  async signAgreements(campaignIds: string[]) {
    try {
      const res = await this.api.BatchSignAgreement({ campaignIds });
      if (res.code !== 0) {
        this.toastService.error(res.message);
      }
      return res;
    } catch (error) {
      this.toastService.error('签署失败，请重试');
      throw error;
    }
  }
}
```

**Key Points:**
- Pure data access + orchestration
- Error handling delegated to caller
- Returns domain entities, not raw API data
- No UI dependencies

### Module Export

```typescript
// application/campaign/index.ts
import { ContainerModule } from 'inversify';
import { CampaignRegisterService } from './campaign-register.service';

export const CampaignApplicationServiceModule = new ContainerModule((bind) => {
  bind(CampaignApplicationTypes.CampaignRegisterService)
    .to(CampaignRegisterService)
    .inSingletonScope();
});
```

## Infra Layer

**Responsibility:** Define platform-agnostic infrastructure interfaces

### Interface Definition

```typescript
// infra/toast-service.contract.ts
export interface ToastService {
  info(msg: string): void;
  error(msg: string): void;
  success(msg: string): void;
  warning(msg: string): void;
}

export const InfraModuleType = {
  ToastService: Symbol.for('ToastService'),
  I18nService: Symbol.for('I18nService'),
  TEAService: Symbol.for('TEAService'),
  CampaignSellerBackendAPI: Symbol.for('CampaignSellerBackendAPI'),
};
```

**Key Points:**
- Pure interface definitions
- No implementations
- Symbol-based identifiers for DI

## Platform-Related Layer

**Responsibility:** Implement interfaces per platform

### Platform Implementation

```typescript
// platform-related/seller-pc/infra/toast.service.ts
import { injectable } from 'inversify';
import { Message } from '@arco-design/web-react';
import type { ToastService } from '@/core/infra/toast-service.contract';

@injectable()
export default class ToastServicePC implements ToastService {
  success(message: string) {
    Message.success(message);
  }

  error(message: string) {
    Message.error(message);
  }

  info(message: string) {
    Message.info(message);
  }

  warning(message: string) {
    Message.warning(message);
  }
}
```

### Platform Module

```typescript
// platform-related/seller-pc/infra/index.ts
import { ContainerModule } from 'inversify';
import { ToastServicePC } from './toast.service';
import { InfraModuleType } from '@/core/infra';

export const SellerPCInfraContainerModule = new ContainerModule((bind) => {
  bind(InfraModuleType.ToastService).to(ToastServicePC).inSingletonScope();
  bind(InfraModuleType.I18nService).to(I18nServicePC).inSingletonScope();
  bind(InfraModuleType.TEAService).to(TEAServicePC).inSingletonScope();
  bind(InfraModuleType.CampaignSellerBackendAPI).toConstantValue(hertzClient);
});
```

### Bootstrap

```typescript
// platform-related/seller-pc/bootstrap.ts
import { Container } from 'inversify';
import { SellerPCInfraContainerModule } from './infra';
import { CampaignApplicationServiceModule } from '@/core/application/campaign';

const container = new Container();

container.load(SellerPCInfraContainerModule);
container.load(CampaignApplicationServiceModule);

export { container };
```

## Data Flow

```
UI Component
    │
    ▼
MobX Store (root + domain stores)
    │
    ├──► Application Service (DI)
    │         │
    │         ├──► Domain Entity (business rules)
    │         └──► Infra API (platform-agnostic)
    │
    └──► Platform Implementation (via DI)
              │
              ├──► PC: Message.success()
              ├──► Mobile: nativeToast.show()
              └──► Lynx: lynxToast.show()
```
