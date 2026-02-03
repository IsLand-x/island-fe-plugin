# Entity and Value Object Design

**APPLIES TO:** Domain modeling, business rule encapsulation

**THIS DOC DESCRIBES:** How to design entities and value objects in DDD frontend

## Entity Design

**When to use:** Business objects with unique identity and business rules

### Characteristics
- Has business ID (unique identifier)
- ID equality means same business concept
- Contains business rules and validations
- "Anemic model" - getters for derived state

### Entity Pattern

```typescript
// domain/campaign/entity/com-campaign.entity.ts
import type { ComCampaign } from '@/types/api';
import type { CampaignTypesVO } from '../vo/campaign-types.vo';

export default class ComCampaignEntity {
  constructor(private data: ComCampaign) {}

  // ============ Identity ============

  get id() {
    return this.data.id;
  }

  // ============ Business Rules ============

  get canRegister() {
    return (
      this.data.status === CampaignStatus.ACTIVE &&
      !this.data.isExpired &&
      this.data.remainingQuota > 0
    );
  }

  get isEditable() {
    return this.data.status === CampaignStatus.DRAFT;
  }

  get hasProducts() {
    return this.data.productCount > 0;
  }

  // ============ Derived Views ============

  get campaignTypes(): CampaignTypesVO {
    return new CampaignTypesVO({
      comCampaignSingleTypes: this.data.comCampaignSingleTypes,
      registerTypes: this.data.registerTypes,
    });
  }

  get displayStatus() {
    if (this.data.isExpired) return '已过期';
    if (this.data.status === CampaignStatus.ACTIVE) return '进行中';
    return '未开始';
  }

  // ============ Validation ============

  validateForRegistration(): ValidationResult {
    const errors: string[] = [];

    if (!this.canRegister) {
      if (this.data.isExpired) {
        errors.push('活动已过期');
      } else if (this.data.remainingQuota <= 0) {
        errors.push('活动名额已满');
      } else if (this.data.status !== CampaignStatus.ACTIVE) {
        errors.push('活动未开始或已结束');
      }
    }

    if (this.campaignTypes.requiresProducts && !this.hasProducts) {
      errors.push('请先添加商品');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Entity Creation from API Data

```typescript
// application/campaign/campaign.service.ts
import { inject, injectable } from 'inversify';
import type { ComCampaignEntity } from '@/domain/campaign/entity/com-campaign.entity';

@injectable()
export default class ComCampaignService {
  @inject(InfraModuleType.CampaignAPI)
  private api: CampaignAPI;

  async listCampaigns(request: ListRequest): Promise<ComCampaignEntity[]> {
    const res = await this.api.list(request);
    return res.data.items.map((item) => new ComCampaignEntity(item));
  }

  async getCampaign(id: string): Promise<ComCampaignEntity> {
    const res = await this.api.get(id);
    return new ComCampaignEntity(res.data);
  }
}
```

## Value Object Design

**When to use:** Reusable stateless logic, type-safe enums, composed判断逻辑

### Characteristics
- No business ID (stateless)
- Immutable, created on-demand
- Reusable across multiple entities
- Encapsulates reusable判断逻辑

### Value Object Patterns

#### Type-Safe Enum Wrapper

```typescript
// domain/shared/vo/enum.vo.ts
export class CampaignStatusVO {
  constructor(private status: string) {}

  static ACTIVE = new CampaignStatusVO('ACTIVE');
  static DRAFT = new CampaignStatusVO('DRAFT');
  static ENDED = new CampaignStatusVO('ENDED');

  get isActive() {
    return this.status === 'ACTIVE';
  }

  get isEditable() {
    return this.status === 'DRAFT';
  }

  get canShowToMerchant() {
    return this.isActive || this.status === 'ENDED';
  }

  toString() {
    return this.status;
  }
}
```

#### Composite Logic VO

```typescript
// domain/campaign/vo/campaign-eligibility.vo.ts
interface EligibilityParams {
  status: string;
  isExpired: boolean;
  remainingQuota: number;
  hasAgreement: boolean;
  minProductCount: number;
  currentProductCount: number;
}

export default class CampaignEligibilityVO {
  constructor(private params: EligibilityParams) {}

  get canRegister() {
    return (
      this.params.status === 'ACTIVE' &&
      !this.params.isExpired &&
      this.params.remainingQuota > 0
    );
  }

  get needsProducts() {
    return this.params.minProductCount > 0;
  }

  get productRequirementMet() {
    return this.params.currentProductCount >= this.params.minProductCount;
  }

  get needsAgreement() {
    return !this.params.hasAgreement;
  }

  get registrationReady() {
    return (
      this.canRegister &&
      (!this.needsProducts || this.productRequirementMet) &&
      (!this.needsAgreement || this.hasAgreed)
    );
  }

  get registrationBlockers(): string[] {
    const blockers: string[] = [];

    if (!this.canRegister) {
      if (this.params.isExpired) blockers.push('活动已过期');
      if (this.params.remainingQuota <= 0) blockers.push('名额已满');
    }

    if (this.needsProducts && !this.productRequirementMet) {
      blockers.push(`最少需要添加 ${this.params.minProductCount} 个商品`);
    }

    return blockers;
  }
}
```

#### Configuration VO

```typescript
// domain/campaign/vo/campaign-config.vo.ts
export class PricingStrategyVO {
  constructor(private config: PricingConfig) {}

  // Constant strategy - use highest price
  static HIGHEST = new PricingStrategyVO({ type: 'HIGHEST' });

  // Percentage discount strategy
  static percentage(percent: number) {
    if (percent <= 0 || percent > 20) {
      throw new Error('折扣必须在 0-20% 之间');
    }
    return new PricingStrategyVO({ type: 'PERCENTAGE', discountPercent: percent });
  }

  get type() {
    return this.config.type;
  }

  get discountPercent() {
    return this.config.discountPercent ?? 0;
  }

  calculatePrice(basePrice: number): number {
    if (this.type === 'HIGHEST') {
      return basePrice; // Use base price as-is
    }
    return basePrice * (1 - this.discountPercent / 100);
  }
}
```

## Entity vs Value Object Decision Tree

```
Is this object identified by a unique ID?
│
├─ YES → Is it a core business concept?
│        ├─ YES → Entity (e.g., Campaign, Order, User)
│        └─ NO → Consider if it needs separate identity
│
└─ NO → Is it stateless logic?
         ├─ YES → Value Object
         └─ NO → Consider if it's a DTO or data transform
```

## Common Patterns

### Lazy VO Creation

```typescript
export default class CampaignEntity {
  private _campaignTypes?: CampaignTypesVO;

  get campaignTypes() {
    if (!this._campaignTypes) {
      this._campaignTypes = new CampaignTypesVO({
        comCampaignSingleTypes: this.data.comCampaignSingleTypes,
        registerTypes: this.data.registerTypes,
      });
    }
    return this._campaignTypes;
  }
}
```

### VO Composition

```typescript
export default class CampaignEntity {
  get fullEligibility() {
    return({
      status: new CampaignEligibilityVO this.data.status,
      isExpired: this.data.isExpired,
      remainingQuota: this.data.remainingQuota,
      hasAgreement: this.data.hasAgreement,
      minProductCount: this.data.minProductCount,
      currentProductCount: this.data.productCount,
    });
  }
}
```

### Entity Equality

```typescript
export default class CampaignEntity {
  equals(other: CampaignEntity): boolean {
    if (!(other instanceof CampaignEntity)) return false;
    return this.id === other.id;
  }
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Instead |
|--------------|---------|
| Business logic in UI components | Move to Entity/VO |
| Exposing raw API data | Wrap in Entity |
| Entity with methods that mutate state | Use immutable getters |
| Creating entities without ID | Use DTO or plain objects |
| VO with internal state | Keep VO stateless |
