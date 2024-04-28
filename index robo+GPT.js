const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views_328');
app.use(express.static(__dirname + '/views_328'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});


function parsePredict(resJson){    
    const predictedClass = resJson.predicted_classes[0]    
    const preClass = String(predictedClass || 0);
    const predictNum = parseInt(preClass.substring(0, 1)); // Convert string to integer
    console.log("predictNum",predictNum)
    return predictNum
}

async function gptPredict(imageData, predictedNum) {
    try {
        const templateText = await getTemplate("cdt_2x");  // Assuming getTemplate is properly defined and awaited elsewhere
        const promptText = `初始基数值 ${predictedNum}，应用下列标准去调整： ${templateText}`;

        const response = await openai.chat.completions.reateChate({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Tell a joke." }


//                { role: "user", content: promptText, attachment: { data: imageData, mime_type: "image/jpeg" } }
            ]
        });

        console.log(response.message);
       const responseText = response.data.choices[0].message  //.content;
        console.log(responseText);
        return responseText;
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        return "-na-";
    }
}

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname + '/views_328' });
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
       
        // Make a POST request to Roboflow API
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

        // Process the response
        console.log(roboResponse.data);
        // Assume function parsePredict exists and works as intended
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
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (error) {
        console.error('Error reading template:', error);
        return "Please explain the content of the image.";
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
