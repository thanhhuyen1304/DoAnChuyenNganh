// Script to kill process using port 5000 on Windows
const { exec } = require('child_process');

console.log('🔍 Đang tìm process sử dụng port 5000...');

exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Không tìm thấy process nào sử dụng port 5000');
    return;
  }

  if (!stdout) {
    console.log('✅ Port 5000 đang trống');
    return;
  }

  // Parse output to get PID
  const lines = stdout.trim().split('\n');
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 0) {
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log('✅ Không tìm thấy PID');
    return;
  }

  console.log(`📋 Tìm thấy ${pids.size} process(es) sử dụng port 5000:`);
  pids.forEach(pid => console.log(`   - PID: ${pid}`));

  // Kill each process
  pids.forEach(pid => {
    console.log(`🔪 Đang kill process PID: ${pid}...`);
    exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
      if (killError) {
        console.error(`❌ Không thể kill process ${pid}:`, killError.message);
      } else {
        console.log(`✅ Đã kill process ${pid}`);
      }
    });
  });

  console.log('\n⏳ Đợi 2 giây để process được giải phóng...');
  setTimeout(() => {
    console.log('✅ Hoàn thành! Bây giờ bạn có thể chạy server.');
  }, 2000);
});

