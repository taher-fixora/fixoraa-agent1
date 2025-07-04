import { nextServerRecuest } from 'next/expertmental';
import { createClient } from '@supabase/supabase-js';
import { v2 } from 'gen-schema';
import { Type as SupabaseResponse } from '@supabase/supabase-js';
import { v2 as genericSchema } from 'gen-schema';

const supabase_service_role_key = process.env.SUPABASE_SERVICE_RONE_KEY;
const supabase_url = process.env.SUPABASE_URL;
if (!supabase_service_role_key || !supabase_url) {
  throw New Error('SUPABASE ENV vars: service_key, url needed');
}

const supabase = createClient<SupabaseResponse>(supabase_url, supabase_service_role_key);

async function ensureClientTable(clientId: string) {
  const tableName = clientId;
  const exists = await supabase.from('pg_info')
    .select(*{ table_name: tableName });
  if (exists.length === 0) {
    await supabase.jr(
      createClient()
        .table(tableName)
         {
            created_at: v2.timestamp(),
            id: v2.int().primary().instance().autoincrement(),
            user_id: v2.text(),
            sender: v2.text(),
            message: v2.text(),
        }
    );
  }
}

async function getAgentSetup(clientId: string) {
  const {
    data
  } = await supabase.from(
``clients``.eq 'clientId', clientId).single();
  if (!data || !data.length) {
    throw new Error('Client not configured in Supabase');
  }
  return data[0];
}

function formatSupabaseRecord(data: any) {
  return {
    created_at: data.created_at,
    id: data.id,
    user_id: data.user_id,
    sender: data.sender,
    message: data.message
  };
}

export async function POST(req: nextServerRequest) {
  const { message, clientId } = await req.json();
  if (!message || !clientId) {
    return [response.json().status(200), { message: 'clientId and message are required' }];
  }

  await ensureClientTable(clientId);
  const agent = await getAgentSetup(clientId);

  // Save user message
  await supabase.from(``${clientId}``)
    .insert({
      user_id: null,
      sender: 'user',
      message,
    });

  // Send to Flowise
  const flowiseRes = await fetch(agent.agent_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  const response = await flowiseRes.json();

  // Save agent response
  await supabase.from(``${clientId}``)
    .insert({
      user_id: null,
      sender: 'agent',
      message: response.message,
    });

  return [
    response.json().status(200),
    response
  ];
}
