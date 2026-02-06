// Debugging Script to Force Level Update
async function debugLevelSystem() {
    console.log("🔍 Starting Level System Debug...");

    // 1. Check Local Storage
    const progress = ProgressStorage.loadProgress();
    console.log("📂 Local Data:", progress);

    if (!progress.total_xp) {
        console.error("❌ No XP found in local storage!");
        return;
    }

    // 2. Force Backend Check
    try {
        console.log(`📡 Checking Backend for ${progress.total_xp} XP...`);
        const levelInfo = await window.apiCall('/progress/level', 'POST', { xp: progress.total_xp });
        console.log("✅ Backend Response:", levelInfo);

        // 3. Compare
        const localLevel = document.getElementById('header-level').textContent;
        console.log(`🖥️ UI Shows: ${localLevel} | Backend Says: Lvl ${levelInfo.current_level}`);

        // 4. Force Update
        if (levelInfo.current_level > 1 && localLevel.includes('1')) {
            console.warn("⚠️ Mismatch detected! Forcing update...");

            // Force save backend truth
            progress.last_notified_level = levelInfo.current_level - 1; // Reset to force notification
            ProgressStorage.saveProgress(progress);

            // Trigger display update
            if (typeof updateProgressDisplay === 'function') {
                await updateProgressDisplay();
                console.log("✨ Update triggered. Check UI.");
                alert(`Debug Success: Forced update to Level ${levelInfo.current_level}`);
            } else {
                console.error("❌ updateProgressDisplay function not found!");
            }
        } else {
            console.log("✅ Levels appear consistent.");
            alert(`System Check: You are Level ${levelInfo.current_level} with ${progress.total_xp} XP.`);
        }

    } catch (e) {
        console.error("❌ Backend Error:", e);
        alert("Backend connection failed. Is the server running?");
    }
}

// Expose to window
window.debugLevelSystem = debugLevelSystem;
console.log("🛠️ debugLevelSystem() loaded. Type 'debugLevelSystem()' in console or call it.");
