from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np

app = Flask(__name__)
# interpreter = tf.lite.Interpreter(model_path="../public/model.tflite")
interpreter = tf.lite.Interpreter(model_path="model (1).tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    input_data = np.array([data], dtype=np.float32)
    interpreter.set_tensor(input_details[0]['index'], input_data)

    interpreter.invoke()

    output_data = interpreter.get_tensor(output_details[0]['index'])[0][0]
    return jsonify(output_data.tolist())

@app.route('/', methods=['POST', 'GET'])
def helloworld():
    return jsonify({
      "message": "Hello World!",
      "error": False
    })

if __name__ == '__main__':
    app.run(port=4000, debug=False, host='0.0.0.0')
