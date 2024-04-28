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

app.get('/', function (req, res) {
    console.log("system in")
    res.sendFile('index.html', { root: __dirname + '/views_328' });
  });

app.post('/api', upload.single('image'),async (req, res) => {
    try {

        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Missing prompt or image data in the request body' });
        }

        console.log('image file uploaded:', imageFile.size);

        const imageData = imageFile.buffer

        const template = await getTemplate("cdt_6"); // Call the getTemplate function
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const imagePart = fileToGenerativePart(imageData, 'image/jpeg'); // Assuming JPEG format

        const result = await model.generateContent([template, imagePart]);
        const response = result.response;
        const text = response.text();

        console.log('Generated text:', text);

        res.json({ result: text });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Function to read the template file
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
