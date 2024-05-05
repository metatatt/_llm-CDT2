// Import core modules
import express from 'express';
import fs, { promises as fsPromises } from 'fs'; // Cleaned up fs import
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv'; // Import dotenv
import { renderFile } from 'ejs'; // Import EJS renderFile
import { tmpdir } from 'os';
import OpenAI from 'openai'; // Import OpenAI


// Simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const memoryTestObjects = join(__dirname, 'templates/memoryTest.json');  // Correct path to your JSON file

// Initialize dotenv to load environment variables
dotenv.config();

// Create Express application
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port, or default to 3000

// Configure Express to use EJS for HTML rendering
app.engine('html', renderFile);
app.set('view engine', 'html');
app.set('views', './views_328'); // Set views directory

// Set static files directory
app.use(express.static('./views_328'));

// Configure body parsing middleware
app.use(express.json({ limit: '5mb' })); // Set JSON payload limit
app.use(express.urlencoded({ extended: true })); // Configure for extended URL-encoded bodies

// Configure multer for in-memory storage handling of file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }); // Initialize multer with memory storage

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });


app.get('/', function (req, res) {
    res.sendFile('index.html', { root: './views_328' });
});
app.post('/speech-to-text', upload.single('audio'), async (req, res) => {
    const audioData = req.file.buffer;
    const tempFilePath = join(tmpdir(), `temp_audio_${Date.now()}.mp3`);
    fs.writeFileSync(tempFilePath, audioData);
    console.log("File size and path:", audioData.length, tempFilePath);

    try {
        // Since the API directly returns a text response, handle it as such
        const transcriptionText = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          response_format: "text",
        });

        console.log("Transcription:", transcriptionText); // Log the transcription text
        res.send(transcriptionText);  // Send the transcription text as response

    } catch (error) {
        console.error("Error during transcription:", error);
        res.status(500).send("Error during transcription: " + error.message);
    } finally {
        // Clean up: remove the temporary file
        fs.unlinkSync(tempFilePath);
    }
});


app.post('/api_session2', async (req, res) => {
    const num = req.body.request;
    const timestamp = Date.now(); // Generate a timestamp
    const filename = `memoryTest${timestamp}.mp3`; // Dynamically generated filename with timestamp
    const speechFile = join(__dirname, 'views_328/assets/mp3', filename);


    try {
        const memoryObjects = JSON.parse(fs.readFileSync(memoryTestObjects, 'utf8'));
        const tools = memoryObjects.tools[Math.floor(Math.random() * memoryObjects.tools.length)];
        const nature = memoryObjects.nature[Math.floor(Math.random() * memoryObjects.nature.length)];
        const lands = memoryObjects.lands[Math.floor(Math.random() * memoryObjects.lands.length)];
        const speechText = `请记住这三个物品，等下我会请你回答它们是什么：${tools}, ${nature}, ${lands}。再说一次，${tools}, ${nature}, ${lands}，请记住了。`;

        // Check if the file exists; if not, generate it
        if (!fs.existsSync(speechFile)) {
            console.log(`Generating audio for:`, speechText);

            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "alloy",
                input: speechText,
            });

            const buffer = Buffer.from(await mp3.arrayBuffer());
            await fs.promises.writeFile(speechFile, buffer);
            console.log('Audio generated and saved successfully!');
        }

        // Send the URL back to the client
        
        res.send({ message: "Audio served/generated successfully!", url: `/assets/mp3/${filename}` });
    } catch (error) {
        console.error('Error during operation:', error);
        res.status(500).send({ message: "Error during operation: " + error.message });
    }
});

app.post('/api_sessionX', async (req, res) => {
    const num = req.body.request;
    const speechText = await getTemplate(`speech${num}`);
    console.log(`Generating unique audio for speech${num}:`, speechText);

    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: speechText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const timestamp = Date.now();
    const filename = `speech${num}-${timestamp}.mp3`;
    const speechFile = `views_328/assets/mp3/${filename}`;

    try {
        await fs.promises.writeFile(speechFile, buffer);
        console.log('Unique audio generated and saved successfully!');
    } catch (error) {
        console.error('Failed to write audio file:', error);
        return res.status(500).send({ message: "Failed to generate audio." });
    }

    // Send the URL back to the client
    res.send({ message: "Unique audio served/generated successfully!", url: `assets/mp3/${filename}` });
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
    const filePath = `./templates/${fileName}`;

    try {
        const data = await fsPromises.readFile(filePath, 'utf8'); // Use fsPromises here
        return data;
    } catch (error) {
        console.error('Error reading template:', error);
        return "Please explain the content of the image.";
    }
}

