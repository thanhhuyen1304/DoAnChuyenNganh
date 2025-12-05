// Script to forcefully kill all Node.js processes
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

  console.log(`📋 Tìm thấy ${pids.length} Node.js process(es), đang kill...`);

  // Kill each process
  pids.forEach(pid => {
    console.log(`🔪 Đang kill Node.js process PID: ${pid}...`);
    exec(`taskkill /PID ${pid} /F`, (killError) => {
      if (killError) {
        console.error(`❌ Không thể kill process ${pid}`);
      } else {
        console.log(`✅ Đã kill process ${pid}`);
      }
    });
  });

  console.log('\n⏳ Đợi 2 giây để processes được giải phóng...');
  setTimeout(() => {
    console.log('✅ Hoàn thành! Bây giờ bạn có thể chạy server.');
  }, 2000);
});

