import express from 'express';
import fs from 'fs';
const { promises: fsPromises } = fs;
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { renderFile } from 'ejs';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 3000;

app.engine('html', renderFile);
app.set('view engine', 'html');
app.set('views', './views_328');
app.use(express.static('./views_328'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });


app.get('/', function (req, res) {
    res.sendFile('index.html', { root: './views_328' });
});


app.post('/instructAudio', async (req, res) => {
    const num = req.body.request;
    let filename, speechFile;

    if (num < 2) {
        filename = 'speechCDT.mp3';
        speechFile =`views_328/assets/mp3/${filename}`;  

        // Check if the file exists; if not, generate it
        if (!fs.existsSync(speechFile)) {
            const speechText = await getTemplate(`speech${num}`);
            console.log(`Generating audio for speech${num}:`, speechText);

            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: speechText,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());
            try {
                await fs.promises.writeFile(speechFile, buffer);
                console.log('Audio generated and saved successfully!');
            } catch (error) {
                console.error('Failed to write audio file:', error);
                return res.status(500).send({ message: "Failed to generate audio." });
            }
        }
    } else {
        // Generate a new unique file each time for num >= 2
        const speechText = await getTemplate(`speech${num}`);
        console.log(`Generating unique audio for speech${num}:`, speechText);

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: speechText,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        filename = `speech${num}-${Date.now()}.mp3`;
        speechFile =`views_328/assets/mp3/${filename}`;  

        try {
            await fs.promises.writeFile(speechFile, buffer);
            console.log('Unique audio generated and saved successfully!');
        } catch (error) {
            console.error('Failed to write audio file:', error);
            return res.status(500).send({ message: "Failed to generate audio." });
        }
    }

    // Send the URL back to the client
    res.send({ message: "Audio served/generated successfully!", url: `assets/mp3/${filename}` });
});

app.post('/api', upload.single('image'), async (req, res) => {

    const cdtPrompt = await getTemplate("minicog_425");
    try {
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Missing prompt or image data in the request body' });
        }

        console.log('image file uploaded:', imageFile.size);
        const imageData = imageFile.buffer.toString('base64');


        //GPT4-Turbo
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "You are an assistant helping to evaluate / score the CDT drawings." },
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: cdtPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageData}`
                                       }
                        }
                    ]
                }
            ],
            max_tokens: 80,  // Limiting the number of tokens can reduce processing time
            temperature: 0.5  // Lower temperature results in more deterministic and focused responses
        });

        console.log(response);
        const responseText = response.choices[0].message.content;
        console.log(responseText);
        res.send(responseText);

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Failed to process image');
    }

});

async function getTemplate(fileName) {
    const filePath = `./templates/${fileName}.txt`;

    try {
        const data = await fsPromises.readFile(filePath, 'utf8'); // Use fsPromises here
        return data;
    } catch (error) {
        console.error('Error reading template:', error);
        return "Please explain the content of the image.";
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
