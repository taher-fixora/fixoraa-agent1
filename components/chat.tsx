use client;

import { useSearchParams} from 'next/navigation';
import { useEffect, useState } from 'react';

export function Chat() {
  const { query } = useSearchParams();
  const clientId = query.object?.clientId; // ex. 'chat.js?clientId=fixora'

  const sendMessage = async (data)=>{\n    await fetch('/api/chat', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({ clientId, message: data })\n    })\n  }\n  return <<div>Chat IN client: {clientId}</div>\n}