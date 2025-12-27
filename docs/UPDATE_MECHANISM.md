# 浏览器插件自动更新机制

## 概述

JSON-LD Checker 实现了完整的版本检测和更新提醒系统，包括：

1. **自动更新检测**
2. **用户通知**
3. **手动检查更新**
4. **更新历史追踪**

## Chrome扩展自动更新

### Chrome内置自动更新

Chrome浏览器默认会自动更新从Chrome Web Store安装的扩展：

- **检查频率**：每5小时检查一次
- **自动下载**：发现新版本后自动下载
- **应用时机**：下次浏览器启动或扩展重新加载时应用

**开发者无需任何额外代码**，Chrome会自动处理。

### 手动触发更新检查

```javascript
chrome.runtime.requestUpdateCheck((status, details) => {
  if (status === 'update_available') {
    console.log('Update available:', details.version);
  } else if (status === 'no_update') {
    console.log('No update available');
  } else if (status === 'throttled') {
    console.log('Check throttled by Chrome');
  }
});
```

## 实现的功能

### 1. 安装/更新检测

在 `background.ts` 中监听扩展安装和更新事件：

```typescript
chrome.runtime.onInstalled.addListener((details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
    // 首次安装 - 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html')
    });
  } else if (details.reason === 'update') {
    // 更新 - 显示更新通知
    const previousVersion = details.previousVersion;
    console.log('Updated from', previousVersion, 'to', currentVersion);
    
    // 存储更新信息
    chrome.storage.local.set({
      lastVersion: previousVersion,
      currentVersion: currentVersion,
      showUpdateNotification: true
    });
    
    // 显示通知
    showUpdateNotification(previousVersion, currentVersion);
  }
});
```

### 2. 更新可用通知

监听Chrome的更新可用事件：

```typescript
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Update available:', details.version);
  
  // 显示通知
  chrome.notifications.create('update-available', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/png/icon-128.png'),
    title: 'JSON-LD Checker Update Available',
    message: `Version ${details.version} is ready to install.`,
    buttons: [
      { title: 'Update Now' },
      { title: 'Later' }
    ],
    requireInteraction: true
  });
});
```

### 3. 定期检查更新

每6小时自动检查一次更新：

```typescript
const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

setInterval(() => {
  chrome.runtime.requestUpdateCheck((status, details) => {
    if (status === 'update_available') {
      console.log('Update available:', details.version);
    }
  });
}, UPDATE_CHECK_INTERVAL);
```

### 4. 用户界面组件

创建了 `UpdateNotification.tsx` 组件，显示：

- ✅ 更新可用提示
- ✅ 最新更新通知
- ✅ 当前版本信息
- ✅ 手动检查更新按钮

集成到 Options 页面：

```tsx
import { UpdateNotification } from '@/components/UpdateNotification';

// 在页面中使用
<UpdateNotification />
```

### 5. 消息通信API

Background提供以下消息接口：

```typescript
// 检查更新
chrome.runtime.sendMessage({ action: 'checkForUpdates' }, (response) => {
  console.log(response.status, response.version);
});

// 获取更新状态
chrome.runtime.sendMessage({ action: 'getUpdateStatus' }, (response) => {
  console.log(response.updateAvailable, response.currentVersion);
});

// 应用更新（重新加载扩展）
chrome.runtime.sendMessage({ action: 'applyUpdate' });

// 关闭更新通知
chrome.runtime.sendMessage({ action: 'dismissUpdateNotification' });
```

## 更新流程

### 正常更新流程

```
1. Chrome检测到新版本
   ↓
2. 自动下载新版本
   ↓
3. 触发 onUpdateAvailable 事件
   ↓
4. 显示通知给用户
   ↓
5. 用户点击"Update Now"
   ↓
6. 调用 chrome.runtime.reload()
   ↓
7. 扩展重新加载，应用新版本
   ↓
8. 触发 onInstalled (reason: 'update')
   ↓
9. 显示更新成功通知
```

### 用户体验

**更新可用时：**
```
┌────────────────────────────────────┐
│ 🎉 Update Available!               │
│ Version 2.1.0 is ready to install. │
│                                     │
│ [Update Now]  [Later]              │
└────────────────────────────────────┘
```

**更新完成后：**
```
┌────────────────────────────────────┐
│ ✨ Successfully Updated!           │
│ Updated from v2.0.0 to v2.1.0      │
│                                     │
│ [Dismiss]                          │
└────────────────────────────────────┘
```

**在Options页面：**
```
┌────────────────────────────────────┐
│ Current Version: v2.0.0            │
│                                     │
│ [🔄 Check for Updates]             │
└────────────────────────────────────┘
```

## 开发测试

### 测试更新流程

1. **修改版本号**
   ```json
   // manifest.json
   "version": "2.0.1"
   ```

2. **加载扩展**
   - Chrome → 扩展 → 开发者模式
   - 加载已解压的扩展

3. **修改版本号（再次）**
   ```json
   "version": "2.0.2"
   ```

4. **点击"更新"按钮**
   - Chrome扩展页面点击"更新"
   - 或在扩展内部调用 `chrome.runtime.requestUpdateCheck()`

5. **查看通知**
   - 应该看到更新可用通知
   - 点击"Update Now"重新加载
   - 查看更新成功通知

### 调试技巧

```javascript
// 在DevTools Console中运行

// 检查当前版本
chrome.runtime.getManifest().version

// 手动检查更新
chrome.runtime.requestUpdateCheck(console.log)

// 查看存储的更新信息
chrome.storage.local.get(['updateAvailable', 'currentVersion', 'lastVersion'], console.log)

// 手动触发更新
chrome.runtime.reload()
```

## 最佳实践

### 1. 版本号规范

使用语义化版本号：`MAJOR.MINOR.PATCH`

```
2.0.0 → 2.0.1  (Bug修复)
2.0.1 → 2.1.0  (新功能)
2.1.0 → 3.0.0  (重大变更)
```

### 2. 更新通知时机

- ✅ 在Options页面显示更新提示
- ✅ 使用Chrome Notifications API
- ❌ 不要在popup中强制显示（popup生命周期短）
- ❌ 不要频繁打扰用户

### 3. 更新日志

建议在更新通知中提供链接到：
- GitHub Releases页面
- 在线更新日志
- 新功能介绍页面

### 4. 渐进式更新

对于重大更新，考虑：
- 数据迁移脚本
- 兼容性检查
- 回退机制

## 发布清单

发布新版本时的检查项：

- [ ] 更新 `manifest.json` 中的 `version`
- [ ] 更新 `package.json` 中的 `version`
- [ ] 编写更新日志（CHANGELOG.md）
- [ ] 测试更新流程
- [ ] 构建生产版本 (`pnpm build`)
- [ ] 提交到Chrome Web Store
- [ ] 创建Git tag (`git tag v2.0.1`)
- [ ] 创建GitHub Release

## Chrome Web Store发布

1. **打包扩展**
   ```bash
   pnpm build
   cd dist
   zip -r ../json-ld-checker-v2.0.1.zip .
   ```

2. **上传到Chrome Web Store**
   - 登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - 选择你的扩展
   - 上传新版本zip文件
   - 填写更新说明
   - 提交审核

3. **审核和发布**
   - 通常1-3天内审核完成
   - 审核通过后自动发布
   - 用户会在几小时内自动收到更新

## 常见问题

### Q: 为什么用户没有收到更新？

A: 可能原因：
- Chrome还未检查更新（最多5小时检查一次）
- 用户禁用了扩展自动更新
- Chrome Web Store发布延迟
- 用户使用的是开发者模式加载的版本

### Q: 如何强制用户更新？

A: 无法强制，但可以：
- 提供明显的更新提示
- 在新功能中检查版本，旧版本显示升级提示
- 后端API检查版本，拒绝过旧版本的请求

### Q: 开发时如何测试更新？

A: 
1. 手动修改版本号
2. 在扩展页面点击"更新"按钮
3. 或调用 `chrome.runtime.requestUpdateCheck()`

### Q: 更新后如何迁移数据？

A:
```typescript
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    const oldVersion = details.previousVersion;
    const newVersion = chrome.runtime.getManifest().version;
    
    // 数据迁移逻辑
    migrateData(oldVersion, newVersion);
  }
});
```

## 参考资料

- [Chrome Extension Update](https://developer.chrome.com/docs/extensions/mv3/manifest/version/)
- [chrome.runtime.onInstalled](https://developer.chrome.com/docs/extensions/reference/runtime/#event-onInstalled)
- [chrome.runtime.onUpdateAvailable](https://developer.chrome.com/docs/extensions/reference/runtime/#event-onUpdateAvailable)
- [chrome.runtime.requestUpdateCheck](https://developer.chrome.com/docs/extensions/reference/runtime/#method-requestUpdateCheck)
- [Publishing in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
