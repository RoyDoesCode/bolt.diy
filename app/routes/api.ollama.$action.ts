// app/routes/api.ollama.$action.ts
import { json } from '@remix-run/cloudflare';

export async function loader({
  params,
  context,
}: {
  params: { action: string };
  context: { cloudflare?: { env: Record<string, string> } };
}) {
  const baseUrl = process.env.OLLAMA_API_BASE_URL;

  if (!baseUrl) {
    return json({ error: 'OLLAMA_API_BASE_URL not defined' }, { status: 500 });
  }

  if (params.action === 'models') {
    const res = await fetch(`${baseUrl}/api/tags`);
    const data = await res.json();
    return json(data);
  }

  return json({ error: 'Invalid GET endpoint' }, { status: 404 });
}

export async function action({
  request,
  params,
  context,
}: {
  request: Request;
  params: { action: string };
  context: { cloudflare?: { env: Record<string, string> } };
}) {
  const baseUrl = process.env.OLLAMA_API_BASE_URL;

  if (!baseUrl) {
    return json({ error: 'OLLAMA_API_BASE_URL not defined' }, { status: 500 });
  }

  const method = request.method;
  const body = await request.text(); // handle stream

  if (params.action === 'pull' && method === 'POST') {
    const res = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    });
  }

  if (params.action === 'delete' && method === 'DELETE') {
    const res = await fetch(`${baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return json({ error: 'Invalid action or method' }, { status: 404 });
}
