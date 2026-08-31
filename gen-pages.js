const fs = require('fs');
const path = require('path');
const base = 'C:\\Users\\chhanda-pc\\Desktop\\CodingVidyaPS\\apps\\web\\src\\app';

const pages = ['volunteers', 'meetings', 'risks', 'announcements', 'documents', 'knowledge', 'ai-assistant', 'analytics'];
const labels = { 'ai-assistant': 'AI Assistant', 'volunteers': 'Volunteers', 'meetings': 'Meetings', 'risks': 'Risks', 'announcements': 'Announcements', 'documents': 'Documents', 'knowledge': 'Knowledge', 'analytics': 'Analytics' };

pages.forEach(d => {
  const dir = path.join(base, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const label = labels[d] || d;
  const content = `'use client';
export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen"><div className="text-center"><p className="text-2xl mb-4">${d === 'ai-assistant' ? '🤖' : d === 'risks' ? '⚠️' : d === 'meetings' ? '📝' : d === 'volunteers' ? '👥' : d === 'announcements' ? '📢' : d === 'documents' ? '📄' : d === 'knowledge' ? '🧠' : '📊'}</p><h1 className="text-xl font-semibold mb-2">${label}</h1><p className="text-gray-500">This page is coming soon</p></div></div>
  );
}`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
  console.log('Created:', d);
});

console.log('Done - all placeholder pages created');