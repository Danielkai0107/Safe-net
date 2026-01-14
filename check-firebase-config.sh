#!/bin/bash

echo "🔍 檢查 Firebase 配置..."
echo "================================"
echo ""

# 檢查 .env 文件是否存在
if [ -f ".env" ]; then
    echo "✅ 找到 .env 文件"
elif [ -f ".env.local" ]; then
    echo "✅ 找到 .env.local 文件"
else
    echo "❌ 未找到 .env 或 .env.local 文件"
    echo ""
    echo "請執行以下命令創建環境變數文件："
    echo "  cp env.example.txt .env.local"
    echo ""
    echo "然後編輯 .env.local 並填入您的 Firebase 配置"
    exit 1
fi

echo ""
echo "📋 檢查環境變數..."
echo "--------------------------------"

# 檢查每個必需的環境變數
check_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env.local 2>/dev/null || grep "^$var_name=" .env 2>/dev/null)
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name - 未設置"
        return 1
    elif echo "$var_value" | grep -q "your_"; then
        echo "⚠️  $var_name - 仍使用預設值，請更新"
        return 1
    else
        echo "✅ $var_name - 已設置"
        return 0
    fi
}

all_ok=true

check_var "VITE_FIREBASE_API_KEY" || all_ok=false
check_var "VITE_FIREBASE_AUTH_DOMAIN" || all_ok=false
check_var "VITE_FIREBASE_PROJECT_ID" || all_ok=false
check_var "VITE_FIREBASE_STORAGE_BUCKET" || all_ok=false
check_var "VITE_FIREBASE_MESSAGING_SENDER_ID" || all_ok=false
check_var "VITE_FIREBASE_APP_ID" || all_ok=false

echo ""
echo "================================"

if [ "$all_ok" = true ]; then
    echo "✅ 所有必需的環境變數都已正確設置！"
    echo ""
    echo "📝 接下來請確保："
    echo "  1. 在 Firebase Console 啟用 Email/Password Authentication"
    echo "  2. 在 Firebase Console Authentication → Users 創建管理員帳號"
    echo "  3. 重新啟動開發伺服器: npm run dev"
    echo ""
else
    echo "❌ 發現配置問題！"
    echo ""
    echo "📖 請閱讀 FIREBASE_AUTH_TROUBLESHOOTING.md 獲取詳細說明"
    echo ""
    echo "🔧 快速修復步驟："
    echo "  1. 前往 Firebase Console: https://console.firebase.google.com/"
    echo "  2. 選擇您的專案 → 齒輪圖標 ⚙️ → Project settings"
    echo "  3. 滾動到 'Your apps' → 複製 firebaseConfig 的值"
    echo "  4. 更新 .env.local 文件"
    echo "  5. 重新啟動開發伺服器"
    echo ""
fi
