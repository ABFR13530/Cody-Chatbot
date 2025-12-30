exports.handler = async (event) => {
  // Log pour debug
  console.log('=== FONCTION APPELÉE ===');
  console.log('Clé API présente ?', !!process.env.ANTHROPIC_API_KEY);
  console.log('Clé commence par sk-ant- ?', process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-'));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Test 1 : Clé existe ?
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ PAS DE CLÉ API');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Clé API non configurée dans Environment Variables de Netlify' 
      })
    };
  }
  
  // Test 2 : Clé valide ?
  if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.error('❌ CLÉ API INVALIDE');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Format de clé API invalide (doit commencer par sk-ant-)' 
      })
    };
  }

  try {
    const { messages, systemPrompt } = JSON.parse(event.body);
    
    console.log('Appel API Anthropic...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages
      })
    });

    console.log('Status API:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERREUR ANTHROPIC:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Erreur API Anthropic (${response.status}): ${errorText}` 
        })
      };
    }

    const data = await response.json();
    console.log('✅ Réponse OK');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: data.content[0].text })
    };
    
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Exception: ${error.message}`,
        stack: error.stack
      })
    };
  }
};
