import { NextServerRequest } from 'next/experimental';
import { createClient } from '@supabase/supabase-js';

const supabase_service_role_key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase_url = process.env.SUPABASE_URL;

if (!supabase_service_role_key || !supabase_url) {
  throw new Error('SUPABASE env vars missing: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL');
}

const supabase = createClient(supabase_url, supabase_service_role_key);

export async function POST(req: NextServerRequest) {
  const { message, clientId } = await req.json();
  if (!message || !clientId) {
    return new Response(JSON.stringify({ error: 'clientId or message missing' }), {
      status: 200
    });
  }

  // Lookup agent data
  const { data: agent} = await supabase.from('clients')
    .select('*')
    .eq('clientId', clientId)
    .single();

  if (!agent) {
    return new Response(JSON.stringify({ error: 'client not configured in supabase' }), {
      status: 200
    });
  }

  // Send user message to Supabase log
  await supabase.from(clientId)
    .insert({
      sender: 'user',
      message,
      user_id: null
    });

  // Send to Flowise
  const flowiseResp = await fetch(agent.agent_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });

  const agentResponse = await flowiseRess.json();

  // Log agent response
  await supabase.from(clientId)
    .insert({
      sender: 'agent',
      message: agentResponse.message,
      user_id: null
    });

  return new Response(JSON.stringify(mixedMessages), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}