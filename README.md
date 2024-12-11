# DiaBite : Cloud Computing

## 📑 Description

This project aims to predict the likelihood of diabetes based on user input and provide personalized dietary recommendations. By combining the power of Deep Neural Networks (DNN) for accurate prediction and Machine Learning (ML) for clustering dietary data, we aim to create an interactive and informative health tool. The application will leverage Gemini to provide user assistance and answer inquiries.

## 📚 Related Project Repositories

|    Learning Paths     |                            Link                             |
| :-------------------: | :---------------------------------------------------------: |
|  🤖 Machine Learning  | [ML Repository](https://github.com/DiaBite-Bangkit-2024/ML) |
| 📱 Mobile Development | [MD Repository](https://github.com/DiaBite-Bangkit-2024/MD) |

## ☁️ Cloud Computing

### REST API for TensorFlow Model using Flask

Implemented a REST API to process input data for diabetes risk prediction.

### REST API using Node.js and deployed to Compute Engine

Implemented a REST API to process user data for diabetes risk prediction and food recommendations. The backend integrates with Machine Learning models stored in Google Cloud Storage for real-time predictions and uses authentication endpoints with JWT for secure user access. The architecture is built on Google Cloud Platform, leveraging Compute Engine for backend deployment, Cloud SQL for database management, and Cloud Storage for handling trained ML models and user-uploaded assets.

> Documentation: [Postman Documenter](https://documenter.getpostman.com/view/39871659/2sAYBYgqbw)

![Screenshot GCP](https://github.com/DiaBite-Bangkit-2024/.github/blob/main/assets/ssgcp.png?raw=true)
![Screenshot Postman](https://github.com/DiaBite-Bangkit-2024/.github/blob/main/assets/sspm.png?raw=true)

## 📚 Libraries Used

This project utilizes several libraries:

| Library                 | Purpose                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `express`               | Acts as the primary framework for building the backend, managing routes, and serving API endpoints.                     |
| `axios`                 | Used as an HTTP client to make requests to external APIs, such as fetching data or sending updates.                     |
| `@google-cloud/storage` | Enables integration with Google Cloud Storage for managing and storing files like profile pictures or other media.      |
| `bcryptjs`              | Provides password hashing and verification for securely handling user credentials.                                      |
| `csv-parse`             | Facilitates reading and parsing CSV files, supporting data imports or processing tasks.                                 |
| `dotenv`                | Manages environment variables securely by loading them from a .env file, ensuring sensitive information remains hidden. |
| `ejs`                   | Serves as a templating engine for rendering dynamic HTML views in the application.                                      |
| `google-auth-library`   | Enables secure authentication and interaction with Google APIs, providing access to Google services.                    |
| `jsonwebtoken`          | Handles the creation and verification of JSON Web Tokens (JWT) for user authentication and session management.          |
| `marked`                | Converts Markdown content into HTML, useful for rendering rich text in the application.                                 |
| `multer`                | Middleware designed for handling file uploads, such as images or documents, in an efficient manner.                     |
| `mysql2`                | Provides robust tools for connecting and executing queries on MySQL databases.                                          |
| `nodemailer`            | Simplifies sending emails directly from the application, such as delivering OTPs or account verification links.         |
| `Flask`                 | Python-based web framework that provides tools and libraries for building web applications.                             |
| `TensorFlow`            | Open-source software library that helps developers and data scientists create and deploy machine learning applications. |

## 🏃‍➡️ How To Run

### Flask App

1. Clone this GitHub Repository

   ```
   git clone https://github.com/DiaBite-Bangkit-2024/CC.git
   ```

2. Change directory to Flask App (`tflask-api`) folder

   ```
   cd tflask-api
   ```

3. Install dependencies

   ```
   # if using pip
   pip install -r requirements.txt

   # if using pip3
   pip3 install -r requirements.txt

   # if using conda
   conda install --yes --file requirements.txt
   ```

4. Run the `app.py`

   ```
   # if using py
   py app.py

   # if using python3
   python3 app.py

   # if using pm2
   pm2 start app.py --name flask-app
   ```

### Node.js App

1. Clone this GitHub Repository

   ```
   git clone https://github.com/DiaBite-Bangkit-2024/CC.git
   ```

2. Change directory to Node.js App (`nodexpress-api`) folder

   ```
   cd nodexpress-api
   ```

3. Install dependencies

   ```
   npm i
   ```

4. Setting up your own `.env` file based on `.env-example` file

5. Run the `app.js`

   ```
   # if using node
   node app.js

   # if using npm
   npm run start

   # if using pm2
   pm2 start app.js --name nodejs-app
   ```
