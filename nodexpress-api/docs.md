# **Dokumentasi DiaBite API**

## **Summary**

| HTTP Method | Endpoint                              | Description                          |
| ----------- | ------------------------------------- | ------------------------------------ |
| `POST`      | [`/auth/register`](#register)         | Registrasi pengguna baru.            |
| `POST`      | [`/auth/verify-otp`](#verify-otp)     | Verifikasi OTP untuk pengguna.       |
| `POST`      | [`/auth/login`](#login)               | Login pengguna dan mendapatkan JWT.  |
| `POST`      | [`/auth/resend-otp`](#resend-otp)     | Mengirim ulang OTP ke email.         |
| `POST`      | [`/auth/save-profile`](#save-profile) | Menyimpan informasi profil pengguna. |
| `GET`       | [`/auth/user-profile`](#user-profile) | Mendapatkan informasi profil.        |
| `PATCH`     | [`/auth/edit-profile`](#edit-profile) | Mengubah informasi profil pengguna.  |
| `*`         | [`/food`](#food)                      | Mendapatkan rekomendasi makanan.     |
| `GET, POST` | [`/predict`](#predict)                | Mendapatkan informasi model predict. |

---

### **Register**

**Endpoint:**  
`POST /auth/register`

**Description:**  
Registrasi pengguna baru dan mengirimkan OTP ke email untuk verifikasi.

**Request Body:**

```json
{
  "email": "johndoe@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Responses:**

- **201 Created**
  ```json
  {
    "message": "User registered successfully. OTP sent to email."
  }
  ```
- **400 Bad Request**
  ```json
  {
    "message": "User already exists."
  }
  ```
- **500 Internal Server Error**
  ```json
  {
    "message": "Database error."
  }
  ```

---

### **Verify OTP**

**Endpoint:**  
`POST /auth/verify-otp`

**Description:**  
Verifikasi OTP untuk akun pengguna.

**Request Body:**

```json
{
  "email": "johndoe@example.com",
  "otp": "1234"
}
```

**Responses:**

- **200 OK**
  ```json
  {
    "message": "OTP verified successfully!",
    "token": "jwt-token"
  }
  ```
- **400 Bad Request**
  ```json
  {
    "message": "Invalid OTP."
  }
  ```
- **404 Not Found**
  ```json
  {
    "message": "User not found."
  }
  ```

---

### **Login**

**Endpoint:**  
`POST /auth/login`

**Description:**  
Login pengguna untuk mendapatkan token JWT.

**Request Body:**

```json
{
  "email": "johndoe@example.com",
  "password": "securepassword123"
}
```

**Responses:**

- **200 OK**
  ```json
  {
    "message": "Login successful.",
    "loginResult": {
      "name": "John Doe",
      "userId": 1,
      "token": "jwt-token"
    }
  }
  ```
- **400 Bad Request**
  ```json
  {
    "message": "Invalid email or password."
  }
  ```
- **403 Forbidden**
  ```json
  {
    "message": "Your account not verified yet."
  }
  ```

---

### **Resend OTP**

**Endpoint:**  
`POST /auth/resend-otp`

**Description:**  
Mengirim ulang OTP ke email pengguna.

**Request Body:**

```json
{
  "email": "johndoe@example.com"
}
```

**Responses:**

- **200 OK**
  ```json
  {
    "message": "OTP resent successfully. Check your email."
  }
  ```
- **404 Not Found**
  ```json
  {
    "message": "User not found."
  }
  ```

---

### **Save Profile**

**Endpoint:**  
`POST /auth/save-profile`

**Description:**  
Menyimpan informasi profil pengguna setelah verifikasi OTP.

**Request Body:**

```json
{
  "email": "johndoe@example.com",
  "age": 25,
  "gender": "male",
  "weight": 70,
  "height": 175,
  "systolic": 120,
  "diastolic": 80
}
```

**Responses:**

- **200 OK**
  ```json
  {
    "message": "User profile updated successfully."
  }
  ```
- **400 Bad Request**
  ```json
  {
    "message": "OTP not verified. Please verify OTP first."
  }
  ```

---

### **User Profile**

**Endpoint:**  
`GET /auth/user-profile`

**Description:**  
Mengambil informasi profil pengguna yang sudah login.

**Headers:**  
`Authorization: Bearer <jwt-token>`

**Responses:**

- **200 OK**
  ```json
  {
    "message": "User profile fetched successfully.",
    "profile": {
      "name": "John Doe",
      "email": "johndoe@example.com",
      "age": 25,
      "gender": "male",
      "height": 175,
      "weight": 70,
      "systolic": 120,
      "diastolic": 80
    }
  }
  ```
- **404 Not Found**
  ```json
  {
    "message": "User not found."
  }
  ```

---

### **Edit Profile**

**Endpoint:**  
`PATCH /auth/edit-profile`

**Description:**  
Mengubah informasi profil pengguna.

**Headers:**  
`Authorization: Bearer <jwt-token>`

**Request Body:**

```json
{
  "name": "Jane Doe",
  "age": 30,
  "gender": "female",
  "height": 165,
  "weight": 60
}
```

**Responses:**

- **200 OK**
  ```json
  {
    "message": "Profile updated successfully."
  }
  ```
- **400 Bad Request**
  ```json
  {
    "message": "No data provided to update."
  }
  ```

---

### **Food**

**Endpoint:**  
`GET /food`

**Description:**  
Mendapatkan rekomendasi makanan berdasarkan tags yang diberikan.

**URL Query:**

```url
tags=["array", "of", "tag"]
```

**Request Body:**

```json
{
  "tags": ["array", "of", "tag"]
}
```

**Responses:**

- **200 OK**

  ```json
  {
    "message": "Success get food recommendation!",
    "error": false,
    "results": {
      "cluster_0": [],
      "cluster_1": [],
      "cluster_2": []
    },
    "resultCount": {
      "cluster_0": 0,
      "cluster_1": 0,
      "cluster_2": 0
    }
  }

  // ["food", "Caloric Value", "Fat", "Saturated Fats", "Monounsaturated Fats", "Polyunsaturated Fats", "Carbohydrates", "Sugars", "Protein", "Dietary Fiber", "Cholesterol", "Sodium", "Water", "Vitamin A", "Vitamin B1", "Vitamin B11", "Vitamin B12", "Vitamin B2", "Vitamin B3", "Vitamin B5", "Vitamin B6", "Vitamin C", "Vitamin D", "Vitamin E", "Vitamin K", "Calcium", "Copper", "Iron", "Magnesium", "Manganese", "Phosphorus", "Potassium", "Selenium", "Zinc", "Nutrition Density"]
  ```

- **500 Server Error**
  ```json
  {
    "message": "Error processing request : ERROR_MSG"
  }
  ```

---

### **Predict**

**Endpoint:**  
`GET /predict`

**Description:**  
Mendapatkan informasi seputar model prediksi diabetes.

**Responses:**

- **200 OK**
  ```json
  {
    "data": {},
    "error": false,
    "message": "Service is running.."
  }
  ```

**Endpoint:**  
`POST /predict`

**Description:**  
Mendapatkan prediksi kemungkinan diabetes.

**Request Body:**

```json
{
  "input": [1, 43, 4, 1, 1, 10, 1, 15, 1, 15]
}
```

**Input Sequence:**
`["HighBP", "BMI", "GenHlth", "DiffWalk", "HighChol", "Age", "HeartDiseaseorAttack", "PhysHlth", "Stroke", "MentHlth"]`

**Responses:**

- **200 OK**
  ```json
  {
    "error": false,
    "message": "Probability updated successfully!",
    "prediction": 0,
    "affectedRows": 1
  }
  ```
