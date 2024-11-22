const path = require("path");
const tflite = require("@tensorflow/tfjs-tflite");
const fetch = require("node-fetch");

// Polyfill fetch untuk TensorFlow.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

function getModelPath() {
  // Define the relative path to the model directory
  const modelDir = "./diabetes-model";

  // Resolve the absolute path to model.json
  const modelPath = path.resolve(modelDir, "model.json");

  // return `file://C:/Users/62812/OneDrive/Documents/PROJECT BANGKIT/capstone/DiaBite/CC/diabetes-model/model.json`;
  return `http://107.175.0.251:5000/diabetes-model/model.json`;
}

// Function to load the model
async function loadModel() {
  const modelPath = getModelPath();
  console.log("Loading model from:", modelPath);

  try {
    // const model = await tflite.loadTFLiteModel(modelPath);
    const model = await tflite.loadTFLiteModel(modelPath);
    console.log("Model loaded successfully");
    return model;
  } catch (error) {
    console.error("Error loading the model:", error);
  }
}

// Example: Load the model and use it
loadModel().then((model) => {
  if (model) {
    console.log("Model is ready to use");
    // Add additional code to use the model for prediction
  }
});
