require('dotenv').config();
const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');
const { getPricePrompt } = require('./pricePrompt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Initialize OpenAI instance (will automatically use OPENAI_API_KEY from environment)
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

// Endpoint to check VIN specifications
app.get('/api/vin/:vin', async (req, res) => {
    try {
        const { vin } = req.params;
        const apiKey = process.env.CARSXE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'CARSXE_API_KEY is not configured.' });
        }

        if (!vin) {
            return res.status(400).json({ error: 'VIN is required.' });
        }

        const response = await axios.get('https://api.carsxe.com/specs', {
            params: {
                key: apiKey,
                vin: vin
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching VIN data:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to calculate market price for a VIN
app.get('/api/vin/:vin/price', async (req, res) => {
    try {
        const { vin } = req.params;
        const carsxeApiKey = process.env.CARSXE_API_KEY;

        if (!carsxeApiKey) {
            return res.status(500).json({ error: 'CARSXE_API_KEY is not configured.' });
        }

        if (!openai) {
            return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
        }

        if (!vin) {
            return res.status(400).json({ error: 'VIN is required.' });
        }

        // 1. Fetch VIN specs from CarsXE
        const vinResponse = await axios.get('https://api.carsxe.com/specs', {
            params: {
                key: carsxeApiKey,
                vin: vin
            }
        });

        const vinJson = JSON.stringify(vinResponse.data, null, 2);

        // 2. Generate prompt
        const prompt = getPricePrompt(vinJson);

        // 3. Request OpenAI to calculate price
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional automotive market valuation AI.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' }
        });

        const priceJsonStr = completion.choices[0].message.content;
        
        let priceData;
        try {
            priceData = JSON.parse(priceJsonStr);
        } catch (e) {
            return res.status(500).json({ error: 'Invalid JSON response from OpenAI.', details: priceJsonStr });
        }

        // 4. Return result
        res.json(priceData);

    } catch (error) {
        console.error('Error calculating VIN price:', error.message);
        if (error.response && error.response.status !== 200) {
            return res.status(error.response.status).json(error.response.data || { error: 'External API Error' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
