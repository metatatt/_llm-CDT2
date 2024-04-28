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

app.get('/', function (req, res) {
    console.log("system in")
    res.sendFile('index.html', { root: __dirname + '/views_328' });
  });

  
  app.post('/api', upload.single('image'), async (req, res) => {
    try {
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ error: 'Missing prompt or image data in the request body' });
        }

        console.log('image file uploaded:', imageFile.size);

        // Get the image data directly from the buffer
        const imageData = imageFile.buffer.toString('base64');
          
        // Make a POST request to Roboflow API
        axios({
            method: "POST",
            //     url: "https://detect.roboflow.com/cdt-khoxh/1",
            url: "https://detect.roboflow.com/cdx2/1",
            params: {
                api_key: rfKey
            },
            data: imageData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        .then(function(response){

        // Process the response
        console.log(response.data);
        res.json({ result: response.data });
        })
        .catch(function(error) {
            console.log(error.message);
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
