# MobX Store Architecture

**APPLIES TO:** Page state management, store design, UI coordination

**THIS DOC DESCRIBES:** How to design MobX stores in DDD-style applications

## Store Structure

```
store/
├── index.tsx              # Provider + hooks export
├── modules/
│   ├── root.ts            # Root store (orchestrator)
│   ├── deps.ts            # Dependencies (router, params)
│   ├── {feature}.ts       # Domain stores
│   └── ui.ts              # UI state stores
```

## Root Store Pattern

```typescript
// store/modules/root.ts
import { makeAutoObservable, runInAction } from 'mobx';
import type { Deps } from './deps';
import type { ParentCampaignStore } from './parent-campaign';
import type { ComCampaignStore } from './com-campaign';
import type { RegistrationStore } from './registration';
import type { TEAStore } from './tea';

export default class Root {
  depsStore: Deps;
  parentCampaignStore: ParentCampaignStore;
  comCampaignStore: ComCampaignStore;
  registrationStore: RegistrationStore;
  teaStore: TEAStore;

  constructor(deps: Deps) {
    this.depsStore = deps;
    this.parentCampaignStore = new ParentCampaignStore(this);
    this.comCampaignStore = new ComCampaignStore(this);
    this.registrationStore = new RegistrationStore(this);
    this.teaStore = new TEAStore(this);

    makeAutoObservable(this, undefined, { autoBind: true });
  }

  // Page-level state
  isPageLoading = true;
  isPageError = false;
  isPageSuccess = false;

  async init() {
    this.isPageLoading = true;
    try {
      await Promise.all([
        this.parentCampaignStore.init(),
        this.comCampaignStore.init(),
      ]);
      await this.registrationStore.init();
      this.isPageError = false;
    } catch (error) {
      this.isPageError = true;
    } finally {
      this.isPageLoading = false;
    }
  }

  retry() {
    this.init();
  }
}
```

## Deps Store (External Dependencies)

```typescript
// store/modules/deps.ts
import { useLocalStore } from 'mobx-react-lite';
import { useRoute } from '@/router';
import { useRouter } from '@/hooks';

export const useCreateDepsStore = () => {
  const routes = useRoute<NamedRoutes.OneLinkRegistrationPage>();
  const router = useRouter();

  const deps = {
    id: routes.params.id,
    router,
  };

  const store = useLocalStore(
    (source) => ({
      get id() {
        return source.id;
      },
      get router() {
        return source.router;
      },
    }),
    deps,
  );

  return store;
};

export type Deps = ReturnType<typeof useCreateDepsStore>;
```

## Domain Store

```typescript
// store/modules/com-campaign.ts
import { makeAutoObservable, runInAction } from 'mobx';
import type { Root } from './root';
import type { ComCampaignEntity } from '@/core/domain/campaign/entity/com-campaign.entity';
import { comCampaignService } from '@/platform-related/seller-pc/export/services';

export default class ComCampaignStore {
  root: Root;

  constructor(root: Root) {
    this.root = root;
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  // Domain state
  comCampaignEntities: ComCampaignEntity[] = [];
  selectedIds: string[] = [];
  isLoading = false;

  get selectedCampaigns() {
    return this.comCampaignEntities.filter((c) =>
      this.selectedIds.includes(c.id),
    );
  }

  get cfvCampaigns() {
    return this.comCampaignEntities.filter((c) =>
      c.campaignTypes.isCFVCampaign,
    );
  }

  async init() {
    this.isLoading = true;
    try {
      const res = await comCampaignService.listOneLinkRegisterComCampaigns({
        parent_campaign_id: this.root.depsStore.id,
      });

      if (res.code !== 0) {
        throw new Error(res.message);
      }

      runInAction(() => {
        this.comCampaignEntities = res.data?.com_campaign_info_list || [];
        // Auto-select CFV campaigns
        this.selectedIds = this.comCampaignEntities
          .filter((c) => c.campaignTypes.isCFVCampaign)
          .map((c) => c.id!);
      });
    } finally {
      this.isLoading = false;
    }
  }

  toggleSelection(id: string) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter((i) => i !== id);
    } else {
      this.selectedIds.push(id);
    }
  }

  showDetailModal(id: string) {
    // Trigger modal via UI store or callback
    this.root.uiStore.showDetailModal(id);
  }

  showTnCModal(id: string) {
    this.root.uiStore.showTnCModal(id);
  }
}
```

## UI Store

```typescript
// store/modules/ui.ts
import { makeAutoObservable } from 'mobx';
import type { Root } from './root';

export default class UIStore {
  root: Root;

  constructor(root: Root) {
    this.root = root;
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  // Modal states
  detailModalVisible = false;
  detailModalCampaignId: string | null = null;
  tncModalVisible = false;
  tncModalCampaignId: string | null = null;
  productDrawerVisible = false;
  productDrawerParams: ProductDrawerParams | null = null;

  showDetailModal(id: string) {
    this.detailModalCampaignId = id;
    this.detailModalVisible = true;
  }

  hideDetailModal() {
    this.detailModalVisible = false;
    this.detailModalCampaignId = null;
  }

  showTnCModal(id: string) {
    this.tncModalCampaignId = id;
    this.tncModalVisible = true;
  }

  hideTnCModal() {
    this.tncModalVisible = false;
    this.tncModalCampaignId = null;
  }

  showProductDrawer(params: ProductDrawerParams) {
    this.productDrawerParams = params;
    this.productDrawerVisible = true;
  }

  hideProductDrawer() {
    this.productDrawerVisible = false;
    this.productDrawerParams = null;
  }
}
```

## Provider Setup

```typescript
// store/index.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useMount } from 'ahooks';
import { useCreateDepsStore } from './modules/deps';
import Root from './modules/root';

const useCreatePageStore = () => {
  const deps = useCreateDepsStore();
  const [store] = useState(() => new Root(deps));

  useMount(() => {
    store.init();
  });

  return store;
};

const PageContext = createContext<ReturnType<typeof useCreatePageStore>>(undefined!);

export const PageStoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useCreatePageStore();

  return (
    <PageContext.Provider value={store}>
      {children}
    </PageContext.Provider>
  );
};

// Export hooks for components
export const useRootStore = () => useContext(PageContext);
export const useDepsStore = () => useRootStore().depsStore;
export const useParentCampaignStore = () => useRootStore().parentCampaignStore;
export const useComCampaignStore = () => useRootStore().comCampaignStore;
export const useRegistrationStore = () => useRootStore().registrationStore;
export const useUIStore = () => useRootStore().uiStore;
```

## Page Usage

```typescript
// pages/CampaignRegistration/index.tsx
import { observer } from 'mobx-react-lite';
import { PageStoreProvider } from './store';
import { useRootStore, useComCampaignStore } from './store';
import { PageWrapper } from '@/components/PageWrapper';
import { ParentCampaignInfo } from './components/ParentCampaignInfo';
import { SelectCampaign } from './components/SelectCampaign';
import { SuccessPage } from './components/SuccessPage';

const CampaignRegistration = observer(() => {
  const rootStore = useRootStore();
  const comCampaignStore = useComCampaignStore();

  // Handle loading/error states
  if (rootStore.isPageSuccess) {
    return <SuccessPage />;
  }

  return (
    <PageWrapper
      loading={rootStore.isPageLoading}
      error={rootStore.isPageError}
      retry={rootStore.retry}
    >
      {() => (
        <div className="registration-page">
          <ParentCampaignInfo />
          <SelectCampaign />
        </div>
      )}
    </PageWrapper>
  );
});

export default observer(() => (
  <PageStoreProvider>
    <CampaignRegistration />
  </PageStoreProvider>
));
```

## Store Modules Summary

| Store Type | Responsibility | Examples |
|------------|---------------|----------|
| Root | Orchestration, page state | init, retry, loading |
| Deps | External dependencies | router, params, user |
| Domain | Business data & actions | campaigns, orders, products |
| UI | Modal/drawer visibility | modalVisible, drawerParams |

## Async Operations

```typescript
async init() {
  this.isLoading = true;
  try {
    const data = await this.service.fetchData();
    runInAction(() => {
      this.data = data;
      this.error = null;
    });
  } catch (error) {
    runInAction(() => {
      this.error = error.message;
    });
  } finally {
    runInAction(() => {
      this.isLoading = false;
    });
  }
}
```
