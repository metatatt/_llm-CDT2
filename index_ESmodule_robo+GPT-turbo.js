import express from 'express';
import axios from 'axios';
import multer from 'multer';
import { promises as fs } from 'fs';
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

function parsePredict(resJson){
    const predictedClass = resJson.predicted_classes[0];
    const preClass = String(predictedClass || 0);
    const predictNum = parseInt(preClass.substring(0, 1)); // Convert string to integer
    console.log("predictNum", predictNum);
    return predictNum;
}

async function gptPredict(imageData, predictedNum) {
    try {
        const templateText = await getTemplate("cdt_2x");
        const promptText = `评估这张图，说明失误或遗漏的地方`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "You are an assistant helping to evaluate / score the CDT drawings." },
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: "What's in this image?" },
                        {
                            type: "image_url",
                            image_url: {
                                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 150,  // Limiting the number of tokens can reduce processing time
            temperature: 0.5  // Lower temperature results in more deterministic and focused responses
        });
        

        console.log(response);
        const responseText = response.choices[0].message.content;
        console.log(responseText);
        return responseText;
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        return "-na-";
    }
}

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: './views_328' });
});

app.post('/api', upload.single('image'), async (req, res) => {
    let predictedNum = "";
    let rePredict = "";
    try {
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ error: 'Missing prompt or image data in the request body' });
        }

        console.log('image file uploaded:', imageFile.size);
        const imageData = imageFile.buffer.toString('base64');

        const roboResponse = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/cdt-ejwb1/3",
            params: {
                api_key: "n9iMMEQU6cbJOGkp7mFF"
            },
            data: imageData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        console.log(roboResponse.data);
        predictedNum = parsePredict(roboResponse.data);
        rePredict = await gptPredict(imageData, predictedNum);

        console.log(predictedNum, rePredict);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

    return res.json({ predictedNum, rePredict });
});

async function getTemplate(fileName) {
    try {
        const filePath = `./templates/${fileName}.txt`;
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error('Error reading template:', error);
        return "Please explain the content of the image.";
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
