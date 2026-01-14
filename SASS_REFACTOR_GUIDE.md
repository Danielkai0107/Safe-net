# SASS 重構指南

## 已完成的重構

### ✅ 核心架構
- SASS 目錄結構（功能導向）
- 設計系統變數（顏色、字體、間距等）
- Mixins 和 Functions
- 基礎樣式（reset, typography, utilities）
- 佈局組件 SASS（container, grid, flex）

### ✅ 共用組件
- Button → 原生 button + BEM classes
- LoadingSpinner → 純 CSS 動畫
- StatusBadge → 原生 span + BEM classes
- ElderCard → 原生 div + BEM classes
- Modal → 保留 MUI Dialog，添加 BEM classes
- Table → 原生 table + BEM classes

### ✅ 已重構頁面
- App.tsx HomePage
- Login 頁面
- AdminDashboard 頁面

## 待完成頁面重構模式

### 重構步驟

#### 1. 更新 Import 語句

**移除：**
```typescript
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
```

**保留（表單和複雜組件）：**
```typescript
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
```

#### 2. 替換佈局組件

| MUI 組件 | SASS 替代方案 | 範例 |
|---------|-------------|------|
| `<Box>` | `<div className="...">` | `<div className="flex flex-between">` |
| `<Container>` | `<div className="container">` | `<div className="container container--xl">` |
| `<Typography>` | `<h1>`, `<p>`, `<span>` | `<h1 className="h1">`, `<p className="text-body-1">` |
| `<Grid>` | `<div className="grid">` | `<div className="grid grid--cols-3 grid--gap-4">` |
| `<Paper>` | `<div className="paper">` | `<div className="paper paper--elevated">` |
| `<Card>` | `<div className="card">` | `<div className="card card--elevated">` |

#### 3. 替換 sx Props

**Before:**
```tsx
<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
    p: 4,
  }}
>
```

**After:**
```tsx
<div className="flex flex-between flex--align-center gap-4 p-4">
```

#### 4. 頁面結構範例

```tsx
export const YourPage: React.FC = () => {
  return (
    <div className="your-page">
      <div className="container container--xl">
        {/* Header */}
        <div className="your-page__header">
          <div className="flex flex-between flex--align-center mb-6">
            <h1 className="your-page__title">頁面標題</h1>
            <div className="your-page__actions flex gap-3">
              <Button variant="contained">操作按鈕</Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="your-page__content">
          <div className="paper paper--elevated">
            {/* 內容 */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 待重構頁面清單

### Admin 頁面
- [ ] TenantManagement.tsx
- [ ] ElderManagement.tsx
- [ ] DeviceManagement.tsx
- [ ] GatewayManagement.tsx
- [ ] TestingTools.tsx
- [ ] FirebaseTest.tsx

### LIFF 頁面
- [ ] ElderList.tsx
- [ ] ElderDetail.tsx
- [ ] AlertList.tsx
- [ ] LiffApp.tsx

## BEM 命名規範

### 頁面級別
```scss
.page-name {
  // 頁面容器
  
  &__header {
    // 頁面標題區
  }
  
  &__title {
    // 標題
  }
  
  &__actions {
    // 操作按鈕區
  }
  
  &__content {
    // 內容區
  }
  
  &--variant {
    // 變體修飾符
  }
}
```

### 組件級別
```scss
.component-name {
  // 組件根元素
  
  &__element {
    // 子元素
  }
  
  &--modifier {
    // 修飾符
  }
}
```

## 常用 Utility Classes

### Flexbox
- `flex` - display: flex
- `flex-center` - 居中對齊
- `flex-between` - 兩端對齊
- `flex-column` - 垂直排列
- `gap-2`, `gap-4`, `gap-6` - 間距

### Spacing
- `m-{size}` - margin
- `mt-{size}`, `mb-{size}`, `ml-{size}`, `mr-{size}` - 單向 margin
- `p-{size}` - padding
- `pt-{size}`, `pb-{size}`, `pl-{size}`, `pr-{size}` - 單向 padding

### Typography
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` - 標題
- `text-body-1`, `text-body-2` - 正文
- `text-caption` - 小字
- `text-center`, `text-left`, `text-right` - 對齊
- `font-bold`, `font-semibold`, `font-medium` - 字重

### Layout
- `container` - 響應式容器
- `grid` - Grid 佈局
- `paper` - 卡片容器
- `rounded`, `rounded-lg`, `rounded-xl` - 圓角
- `shadow`, `shadow-lg` - 陰影

## 注意事項

1. **保留 MUI 表單組件**：TextField, Select, Checkbox, Radio, Dialog, Modal, Snackbar
2. **移除所有 sx props**：改用 className 和 SASS
3. **使用 BEM 命名**：嚴格遵循 Block__Element--Modifier 規範
4. **響應式設計**：使用 mixins 確保 mobile-first
5. **保持功能一致**：重構期間不改變任何業務邏輯

## 快速替換指令（VS Code）

### 1. 替換 Box import
搜索：`import.*Box.*from "@mui/material/Box";?\n?`
替換：（刪除）

### 2. 替換簡單 Box
搜索：`<Box>`
替換：`<div>`

搜索：`</Box>`
替換：`</div>`

### 3. 替換 Container
搜索：`<Container maxWidth="(.*?)">`
替換：`<div className="container container--$1">`

### 4. 替換 Typography
搜索：`<Typography variant="(h[1-6])".*?>`
替換：`<$1 className="$1">`

## 測試清單

重構完成後，請確認：
- [ ] 所有頁面視覺正常
- [ ] 響應式設計在各裝置正常
- [ ] 表單組件功能正常
- [ ] Modal/Dialog 互動正常
- [ ] 按鈕狀態正常
- [ ] 無 console 錯誤
- [ ] 構建成功（`npm run build`）
