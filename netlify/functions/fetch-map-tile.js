const axios = require('axios');

exports.handler = async (event, context) => {
    // A chave da API deve ser armazenada como uma variável de ambiente no Netlify
    const API_KEY = process.env.WEATHER_API; 

    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Chave de API não configurada no ambiente.' }),
        };
    }

    const { layer, z, x, y } = event.queryStringParameters;

    if (!layer || !z || !x || !y) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Parâmetros de tile (layer, z, x, y) ausentes.' }),
        };
    }

    // Constrói a URL do tile do OpenWeatherMap de forma segura no backend
    const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${API_KEY}`;

    try {
        const response = await axios.get(tileUrl, { responseType: 'arraybuffer' });

        if (response.status !== 200) {
            throw new Error(`Erro ao buscar tile: ${response.status} ${response.statusText}`);
        }

        // O Netlify Functions pode lidar com o streaming de binários (como imagens)
        // usando o 'isBase64Encoded' e convertendo o buffer.
        const buffer = Buffer.from(response.data, 'binary');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png', // O tipo de conteúdo esperado para tiles PNG
                'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Erro no proxy de tile:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno ao processar o tile.' }),
        };
    }
};
