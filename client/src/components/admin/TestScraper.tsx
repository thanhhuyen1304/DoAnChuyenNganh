import React from 'react';

const TestScraper = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Scraper Component</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ✅ Component đang render thành công!
      </div>
      <div className="mt-4">
        <p>Nếu bạn thấy thông báo này, có nghĩa là component đang hoạt động.</p>
        <p>Vấn đề có thể là:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Lỗi JavaScript trong ProblemScraper component</li>
          <li>Missing dependencies hoặc imports</li>
          <li>CSS styling issues</li>
        </ul>
      </div>
    </div>
  );
};

export default TestScraper;
