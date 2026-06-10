const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken')


// Model import kiya
const Script = require('./models/Script');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET ;
// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch((err) => console.error('MongoDB Connection Error:', err));


// authentication route

app.use('/api/auth' , require('./routes/auth'));

//middleware
const fetchUser = (req, res, next) => {
    
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ success: false, error: "Access Denied. Bhai, login kar pehle!" });
    }

    try {
        const token = authHeader.replace("Bearer ", "");
        const decodedData = jwt.verify(token, JWT_SECRET);
        req.user = decodedData; 
        next(); 
    } catch (error) {
        res.status(401).json({ success: false, error: "Invalid or Expired Token." });
    }
};

// Basic Route
app.get('/', (req, res) => {
    res.send('AutoScript AI Backend is running super fast with Groq & MongoDB!');
});

// AI Generation Route
app.post('/api/generate',fetchUser, async (req, res) => {
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

        // Database maii save
        const newScript = new Script({
            userId:req.user.userId,
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
app.get('/api/history',fetchUser, async (req, res) => {
    try {


        const history = await Script.find({userId:req.user.userId}).sort({ createdAt: -1 }); // Latest first
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