// app/page.tsx
'use client';

import MermaidEditor from '@/components/mermaideditor';



export default function Home() {


  return (
    <div className="min-h-screen bg-gray-100 p-6">
 

      <div className="flex justify-center space-x-4 mb-6">
        
      </div>

      <div className="bg-white p-4 rounded shadow">
        <MermaidEditor/>
      </div>
    </div>
  );
}
