sed -i 's/setShortcutSymbol("\\342\\214\\230")/\/\/ eslint-disable-next-line\n      setShortcutSymbol("\\342\\214\\230")/g' app/dashboard/chats/page.tsx
sed -i 's/setShortcutSymbol("⌘")/\/\/ eslint-disable-next-line\n      setShortcutSymbol("⌘")/g' app/dashboard/inbox/page.tsx
sed -i 's/setTodayStats({/\/\/ eslint-disable-next-line\n    setTodayStats({/g' app/dashboard/page.tsx
