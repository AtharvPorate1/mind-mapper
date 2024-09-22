// app/api/generate-mermaid/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();

    // Use JSDOM and Readability to extract the main content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error('Failed to extract content from the webpage');
    }

    // Limit the content to 2000 characters for the AI prompt
    const extractedContent = article.textContent.slice(0, 2000);

    // Generate Mermaid syntax using OpenAI
    const aiResponse = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `Convert the following webpage content into a Mermaid diagram that represents the main structure and flow of information:\n\n${extractedContent}\n\nMermaid syntax:`,
      max_tokens: 500,
      temperature: 0.7,
    });

    const mermaidCode = aiResponse.choices[0].text?.trim();

    if (!mermaidCode) {
      throw new Error('Failed to generate Mermaid code');
    }

    return NextResponse.json({ mermaidCode });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}