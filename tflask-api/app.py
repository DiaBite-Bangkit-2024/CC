from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import json
import os

app = Flask(__name__)
interpreter = tf.lite.Interpreter(model_path=os.path.join(__file__, "model.tflite"))
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json.get('input', None)
        if data is None:
            return jsonify({"error": True, "message": "Input data is required"}), 400

        input_data = np.array([data], dtype=np.float32)

        interpreter.set_tensor(input_details[0]['index'], input_data)

        interpreter.invoke()

        output_data = interpreter.get_tensor(output_details[0]['index'])[0][0]

        return jsonify({"error": False, "message": "Success get the prediction!", "prediction": output_data.tolist()}), 200

    except KeyError as e:
        return jsonify({"error": True, "message": f"Missing key in input data: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": True, "message": f"Invalid input format: {str(e)}"}), 400
    except tf.errors.InvalidArgumentError as e:
        return jsonify({"error": True, "message": f"TensorFlow error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": True, "message": f"An unexpected error occurred: {str(e)}"}), 500



@app.route('/', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
@app.route('/index', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
def helloworld():
    try:
        with open('info.json', 'r') as file:
            data = json.load(file)
        return jsonify({ "data": data, "error": False, "message": "Service is running.." })
    except FileNotFoundError:
        return jsonify({"error": True, "message": "File not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": True, "message": "Error decoding JSON"}), 400

if __name__ == '__main__':
    app.run(port=4000, debug=False, host='0.0.0.0')
