const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const dotenv = require("dotenv");
const multer = require('multer');
const axios = require('axios'); // Import axios for making HTTP requests

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', 'views');
app.use(express.static(__dirname + '/views_328'));
app.use(bodyParser.json({limit:'5mb'}));

// Roboflow API key from environment variable
const rfKey = process.env.RF_API_KEY;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

function fileToGenerativePart(data, mimeType) {
    return {
        inlineData: {
            data: data.toString('base64'),
            mimeType,
        },
    };
}

function parsePredict(resJson){    
    const data = resJson.result;
    const predictedClass = data.predicted_classes[0]    
    const preClass = String(predictedClass || 0);
    const predictNum = parseInt(preClass.substring(0, 1)); // Convert string to integer
    console.log("predictNum",predictNum)
    return predictNum
}

async function refinedPredict(imageData,predictedNum) {
    const text1 = await getTemplate("cdt_2x"); // Call the getTemplate function
    const text2 = `初始基数值 ${predictedNum}，应用下列标准去调整： `+text1
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const imagePart = fileToGenerativePart(imageData, 'image/jpeg'); // Assuming JPEG format

    const result = await model.generateContent([text2, imagePart]);
    const response = result.response;
    const text = response.text();
    return text
};

app.get('/', function (req, res) {
    console.log("system in")
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

        // Get the image data directly from the buffer
        const imageData = imageFile.buffer.toString('base64');
          
        // Make a POST request to Roboflow API
        const response = await axios({
            method: "POST",
            //     url: "https://detect.roboflow.com/cdt-khoxh/1",
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
        console.log(response.data);
        predictedNum = parsePredict({ result: response.data });
        console.log('predict ', predictedNum);
        
        rePredict = await refinedPredict(imageData, predictedNum);
        console.log(rePredict);

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
        predictedNum = -1;
        rePredict = "Error processing request";
    }

    return res.json({ predictedNum, rePredict });
});



async function getTemplate(fileName) {
    try {
        const filePath = `./templates/${fileName}.txt`; // Adjusted file path
        const textContent = await fs.promises.readFile(filePath, 'utf-8');
        return textContent;
    } catch (error) {
        console.error('Error reading template:', error);
        // Return a default message if the file doesn't exist or an error occurs
        return "Please explain the content of the image.";
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
