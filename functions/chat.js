exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Vérification de la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: "❌ ERREUR : Clé API Anthropic non configurée dans Netlify.\n\nAllez dans Site configuration → Environment variables et ajoutez ANTHROPIC_API_KEY" 
        })
      };
    }

    const { messages, systemPrompt } = JSON.parse(event.body);
    
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

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          response: `❌ ERREUR API Anthropic (${response.status}):\n${errorText}\n\nVérifiez que votre clé API est valide sur console.anthropic.com` 
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: data.content[0].text })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        response: `❌ ERREUR TECHNIQUE:\n${error.message}\n\nStack: ${error.stack}` 
      })
    };
  }
};
