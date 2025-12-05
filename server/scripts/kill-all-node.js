// Script to kill all Node.js processes (use with caution)
const { exec } = require('child_process');

console.log('🔍 Đang tìm tất cả Node.js processes...');

exec('tasklist | findstr node.exe', (error, stdout, stderr) => {
  if (error || !stdout) {
    console.log('✅ Không tìm thấy Node.js process nào');
    return;
  }

  const lines = stdout.trim().split('\n');
  const pids = [];

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 1) {
      const pid = parts[1];
      if (pid && !isNaN(pid)) {
        pids.push(pid);
      }
    }
  });

  if (pids.length === 0) {
    console.log('✅ Không tìm thấy Node.js process');
    return;
  }

  console.log(`📋 Tìm thấy ${pids.length} Node.js process(es):`);
  pids.forEach(pid => console.log(`   - PID: ${pid}`));

  console.log('\n⚠️  Bạn có muốn kill tất cả các process này không?');
  console.log('   (Chạy: node scripts/kill-all-node-force.js để kill tự động)');
});

