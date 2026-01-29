# UI Component Patterns

**APPLIES TO:** Component design, business logic separation, React components

**THIS DOC DESCRIBES:** How to design UI components that work with DDD architecture

## Core Principle

**Components should be "renderers" of domain entities, not holders of business logic.**

```
┌────────────────────────────────────────┐
│  Domain Entity                         │  ← Contains business rules
│  (ComCampaignEntity)                   │
└────────────┬───────────────────────────┘
             │ passed as prop
             ▼
┌────────────────────────────────────────┐
│  UI Component (Renderer)               │  ← Pure presentation
│  (CampaignCardRenderer)                │
│  - Receives entity                     │
│  - Calls entity methods                │
│  - No business logic                   │
└────────────────────────────────────────┘
```

## Anti-Pattern: Business Logic in UI

```typescript
// ❌ BAD: Business logic scattered in UI components
const CampaignCard = ({ campaignData }) => {
  // Business rules defined in component
  const isCFV = campaignData.comCampaignSingleTypes?.includes(
    ComCampaignSingleType.ComCampaignSingleType_PRODUCT_CO_FUND
  );

  const canRegister = campaignData.status === CampaignStatus.ACTIVE &&
                     !campaignData.isExpired &&
                     campaignData.remainingQuota > 0;

  // UI rendering mixed with business logic
  return (
    <div className="campaign-card">
      {isCFV && <Tag color="red">CFV Campaign</Tag>}
      <h3>{campaignData.displayName}</h3>
      <Button
        disabled={!canRegister}
        onClick={() => handleRegister(campaignData)}
      >
        立即报名
      </Button>
    </div>
  );
};
```

## Recommended Pattern: Entity Renderer

### Component Interface

```typescript
// components/CampaignCard/types.ts
import type { ComCampaignEntity } from '@/core/domain/campaign/entity/com-campaign.entity';

export interface CampaignCardProps {
  campaign: ComCampaignEntity;
  onViewDetail?: (campaign: ComCampaignEntity) => void;
  onViewTerms?: (campaign: ComCampaignEntity) => void;
  onRegister?: (campaign: ComCampaignEntity) => void;
}
```

### Component Implementation

```typescript
// components/CampaignCard/CampaignCardRenderer.tsx
import { observer } from 'mobx-react-lite';
import type { CampaignCardProps } from './types';

const CampaignCardRenderer = observer(({
  campaign,
  onViewDetail,
  onViewTerms,
  onRegister,
}: CampaignCardProps) => {
  // All business rules come from entity
  const { canRegister, campaignTypes, displayName } = campaign;

  return (
    <div className="campaign-card">
      <div className="campaign-header">
        <h3>{displayName}</h3>
        {campaignTypes.isCFVCampaign && <CFVBadge />}
        {campaignTypes.isAMSOrBNPLCampaign && <AMSBNPLBadge />}
      </div>

      <div className="campaign-info">
        <span className="status">{campaign.displayStatus}</span>
        {campaign.remainingQuota > 0 && (
          <span className="quota">
            剩余名额: {campaign.remainingQuota}
          </span>
        )}
      </div>

      <div className="campaign-actions">
        <Button
          type="primary"
          disabled={!canRegister}
          onClick={() => onRegister?.(campaign)}
        >
          立即报名
        </Button>

        <Button
          type="link"
          onClick={() => onViewDetail?.(campaign)}
        >
          查看详情
        </Button>

        <Button
          type="link"
          onClick={() => onViewTerms?.(campaign)}
        >
          查看条款
        </Button>
      </div>

      {!canRegister && (
        <div className="blockers">
          {campaign.registrationBlockers.map((blocker) => (
            <Tag color="red" key={blocker}>
              {blocker}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
});

export default CampaignCardRenderer;
```

## Component Organization

```
components/
├── CampaignCard/
│   ├── index.ts              # Exports
│   ├── types.ts              # TypeScript interfaces
│   ├── CampaignCardRenderer.tsx    # Main component
│   ├── CFVBadge.tsx          # Sub-components
│   ├── AMSBNPLBadge.tsx
│   └── styles.module.scss
├── CampaignList/
│   ├── index.ts
│   ├── types.ts
│   └── CampaignList.tsx
├── CampaignDetail/
│   ├── index.ts
│   ├── types.ts
│   ├── CampaignDetail.tsx
│   └── DetailDrawer.tsx
└── common/                   # Generic UI components
    ├── PageWrapper/
    ├── Modal/
    └── Button/
```

## Page Component Usage

```typescript
// pages/CampaignList/index.tsx
import { observer } from 'mobx-react-lite';
import { useCampaignStore } from '@/pages/Campaign/store';
import CampaignCard from '@/components/CampaignCard';

const CampaignListPage = observer(() => {
  const store = useCampaignStore();

  return (
    <div className="campaign-list-page">
      {store.campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onViewDetail={(c) => store.showDetailModal(c.id)}
          onViewTerms={(c) => store.showTermsModal(c.id)}
          onRegister={(c) => store.register(c.id)}
        />
      ))}
    </div>
  );
});

export default CampaignListPage;
```

## Pure UI Components

For generic UI elements without business logic:

```typescript
// components/common/PageWrapper/PageWrapper.tsx
import { Spin } from '@arco-design/web-react';
import styles from './PageWrapper.module.scss';

interface PageWrapperProps {
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  children: () => React.ReactNode;
}

const PageWrapper = ({
  loading = false,
  error = false,
  retry,
  children,
}: PageWrapperProps) => {
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>
          <p>页面加载失败</p>
          {retry && (
            <Button onClick={retry}>重试</Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children()}</>;
};

export default PageWrapper;
```

## Business Components (Composite)

For reusable business patterns:

```typescript
// components/campaign/CampaignEligibilityBadge.tsx
import { observer } from 'mobx-react-lite';
import type { ComCampaignEntity } from '@/core/domain/campaign/entity/com-campaign.entity';

interface CampaignEligibilityBadgeProps {
  campaign: ComCampaignEntity;
}

const CampaignEligibilityBadge = observer(({ campaign }: CampaignEligibilityBadgeProps) => {
  const { canRegister, registrationBlockers } = campaign;

  if (canRegister) {
    return <Tag color="green">可报名</Tag>;
  }

  return (
    <Tooltip
      content={
        <ul>
          {registrationBlockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      }
    >
      <Tag color="red" className="blocker-tag">
        暂不可报名
      </Tag>
    </Tooltip>
  );
});

export default CampaignEligibilityBadge;
```

## Component Props Design

| Pattern | Example | When to Use |
|---------|---------|-------------|
| Entity Prop | `campaign: ComCampaignEntity` | Business data with rules |
| ID Prop | `campaignId: string` | When entity already exists elsewhere |
| Callback with Entity | `onRegister: (c: ComCampaignEntity) => void` | Action handlers |
| Simple Types | `loading: boolean`, `disabled: boolean` | Pure UI state |
| Config Objects | `{ mode: 'edit' \| 'view' }` | Component behavior |

## Testing Components

```typescript
// __tests__/CampaignCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CampaignCardRenderer from '@/components/CampaignCard';

// Create mock entity
const mockCampaign = {
  id: '123',
  displayName: 'Test Campaign',
  canRegister: true,
  campaignTypes: { isCFVCampaign: false },
  displayStatus: '进行中',
  remainingQuota: 100,
  registrationBlockers: [],
};

describe('CampaignCardRenderer', () => {
  it('renders campaign info correctly', () => {
    render(
      <CampaignCardRenderer
        campaign={mockCampaign as any}
        onRegister={jest.fn()}
      />
    );

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
  });

  it('calls onRegister when button clicked', () => {
    const onRegister = jest.fn();

    render(
      <CampaignCardRenderer
        campaign={mockCampaign as any}
        onRegister={onRegister}
      />
    );

    fireEvent.click(screen.getByText('立即报名'));
    expect(onRegister).toHaveBeenCalledWith(mockCampaign);
  });

  it('disables register button when cannot register', () => {
    const nonRegisterableCampaign = {
      ...mockCampaign,
      canRegister: false,
      registrationBlockers: ['活动已过期'],
    };

    render(
      <CampaignCardRenderer
        campaign={nonRegisterableCampaign as any}
        onRegister={jest.fn()}
      />
    );

    expect(screen.getByText('立即报名')).toBeDisabled();
  });
});
```

## Summary

| Component Type | Business Logic | Examples |
|----------------|---------------|----------|
| Pure UI | None | Button, Modal, PageWrapper |
| Entity Renderer | 0% (delegated to entity) | CampaignCard, OrderSummary |
| Business Composite | Minimal (composition) | CampaignEligibilityBadge |
| Page | Orchestration only | CampaignListPage |
