const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Groq = require('groq-sdk');

// Model import kiya
const Script = require('./models/Script');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('AutoScript AI Backend is running super fast with Groq & MongoDB!');
});

// AI Generation Route
app.post('/api/generate', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic field is required." });
        }

        const prompt = `Act as an expert YouTube tech content creator. Write a short, engaging, and professional 1-minute video script for the following topic: "${topic}". Include visual/B-roll suggestions in brackets.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant", 
        });

        const generatedText = chatCompletion.choices[0]?.message?.content || "No script generated.";

        // Database me save karna
        const newScript = new Script({
            topic: topic,
            generatedScript: generatedText
        });
        await newScript.save();

        res.status(200).json({
            success: true,
            script: generatedText
        });

    } catch (error) {
        console.error("Groq AI Generation Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "An internal server error occurred while generating the script." 
        });
    }
});

// Fetch All Generated Scripts History
app.get('/api/history', async (req, res) => {
    try {
        const history = await Script.find().sort({ createdAt: -1 }); // Latest first
        res.status(200).json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "An internal server error occurred while fetching history." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
