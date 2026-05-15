**Platform Integration API**

SCOPE Deployment Documentation

Version 1.0  |  Confidential

# **Overview**

This document describes the platform Integration API that allows partner organizations to submit user payment data and retrieve updated user status. All communication is secured using a Bearer Token issued by us per organization.

| Base URL https://beta.kommonschool.com/v1/api/ |  |
| :---- | ----- |

| Authentication All API endpoints require a Bearer Token. The token is unique per organization and must be included in every request header. Token: kommonai-2d92a280a91dae6bb52b117c8ef69f31bbefa18e3ba6bef965b4d944a1332227 |  |
| :---- | ----- |

# **Authentication**

Every request must include a valid Bearer Token in the Authorization header. The token is tied to your organization. We validate the token, resolve your Organization Code, and process the request accordingly.

**Request Header**

Authorization: Bearer \<your\_token\_here\>  
Content-Type: application/json

If the token is missing or invalid, the API will return a 401 Unauthorized response.

# 

# **API 1 \- Submit User Data**

| POST | https://beta.kommonschool.com/v1/api/integrations/provision-user Submit a new user record after payment |
| :---- | :---- |

## **Description**

When a user completes a payment on your platform, send their data to this endpoint. We will create or update the user record in our system, link it to your organization using the Bearer Token, and initialize the required status fields.

## **Request Headers**

| Header | Required | Description |
| :---- | :---- | :---- |
| Authorization | Required | Bearer \<your\_token\_here\> |
| Content-Type | Required | application/json |

## **Request Body**

Send the following fields as a JSON object in the request body:

| Field Name | Type | Description |
| :---- | :---- | :---- |
| firstName | String | First name of the user |
| lastName | String | Last name of the user |
| email | String | Email address of the user (must be unique) |
| phoneNumber | String | Phone number including country code |
| plan | String | Subscription plan the user purchased |
| group | String | Group the user belongs to |
| unit | String | Unit assigned to the user |
| phase | String | Current phase of the user |
| segment | String | Segment category for the user |
| transactionId | String | Transaction ID for the user from payment gateway |
| amount | Number | Amount transacted, to be shown in user pay history |

All fields listed above are required. The request will be rejected if any field is missing.

## **Example Request (Fields mentioned are for the reference only)**

POST /api/v1/user HTTP/1.1  
Host: sample.kommonschool.com  
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…   
Content-Type: application/json

{  
  "firstName": "Ravi",  
  "lastName": "Sharma",  
  "email": "ravi.sharma@example.com",  
  "phoneNumber": "+919876543210",  
  "plan": "SUMAGO30",  
  "group": "group\_A",  
  "unit": "unit\_01",  
  "phase": "phase\_2",  
  "segment": "enterprise"  
  "transactionId": "txn\_abc123",  
  "amount": 1999  
}

## **Fields Added Automatically by Our System**

Upon receiving a valid POST request, we add the following fields internally. You do not need to send these:

| Field Name | Type | Description |
| :---- | :---- | :---- |
| emailStatus | String | Status of email verification (e.g. DELIVERY , BOUNCED, FAILED ) |
| onboardingStatus | String | Tracks onboarding progress of the user (SUCCESS, PENDING, IN\_REVIEW ) |
| planHistory | Array | Array of payment records; updated each time user renews |

## **Success Response \- 201 Created**

{  
  "status": "success",  
  "message": "User data received",  
  "email": "ravi.sharma@example.com"  
}

## **Error Responses**

| HTTP Status | Description |
| :---- | :---- |
| 400 Bad Request | One or more required fields are missing or invalid |
| 401 Unauthorized | Bearer Token is missing, invalid, or expired |
| 409 Conflict | A user with the same email already pending to onboard |
| 500 Internal Server Error | Unexpected server error; contact our support team |

# **API 2 \- Retrieve User Data & Status**

| GET | https://beta.kommonschool.com/v1/api/integrations/get-users Retrieve all users and their status for your organization |
| :---- | :---- |

## **Description**

Use this endpoint to retrieve the complete list of users submitted by your organization, including all submitted fields and the status fields maintained by our system (emailStatus, onboardingStatus, renewStatus).

## **Request Headers**

| Header | Required | Description |
| :---- | :---- | :---- |
| Authorization | Required | Bearer \<your\_token\_here\> |

No request body is needed for this endpoint. The Bearer Token identifies your organization and scopes the results accordingly.

## 

## **Example Request  (Fields mentioned are for the reference only)**

GET /api/v1/user HTTP/1.1  
Host: sample.kommonschool.com  
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## **Success Response \- 200 OK**

Returns a JSON object with organization details and an array of user records:

{  
  "status": "success",  
  "organizationCode": "ORG\_XYZ",  
  "totalUsers": 2,  
  "users": \[  
    {  
      "userId": "usr\_4f8a2b1c9d",  
      "firstName": "Ravi",  
      "lastName": "Sharma",  
      "email": "ravi.sharma@example.com",  
      "phoneNumber": "+919876543210",  
      "plan": "premium",  
      "group": "group\_A",  
      "unit": "unit\_01",  
      "phase": "phase\_2",  
      "segment": "enterprise",  
      "emailStatus": "verified",  
      "onboardingStatus": "completed",  
      "planHistory": \[  
        {  
          "paymentDate": "2024-01-15T10:30:00Z",  
          "amount": 1999,  
          "plan": "SUMAGO30",  
          "transactionId": "txn\_abc123"  
        },  
        {  
          "paymentDate": "2025-01-15T09:00:00Z",  
          "amount": 1999,  
          "plan": "SUMAGO60",  
          "transactionId": "txn\_def456"  
        }  
      \]  
    },  
    { ... }  
  \]  
}

## **Response Fields Reference**

| Field Name | Type | Description |
| :---- | :---- | :---- |
| userId | String | Unique user identifier assigned by our system |
| firstName | String | First name submitted by your organization |
| lastName | String | Last name submitted by your organization |
| email | String | Email address of the user |
| phoneNumber | String | Phone number of the user |
| plan | String | Subscription plan of the user |
| group | String | Group the user belongs to |
| unit | String | Unit assigned to the user |
| phase | String | Current phase of the user |
| segment | String | Segment category for the user |
| emailStatus | String | Email verification status |
| onboardingStatus | String | Onboarding completion status |
| planHistory | Array | History of all payments/renewals for this user |

## **planHistory Array**

Each object inside planHistory represents one payment or renewal event. New entries are appended automatically when a user pays again.

| Field Name | Type | Description |
| :---- | :---- | :---- |
| paymentDate | String (ISO 8601\) | Date and time of user data gets recorded |
| amount | Number | Amount paid |
| plan | String | Plan associated with this renewal |
| transactionId | String | Unique transaction identifier |

## 

## **Error Responses**

| HTTP Status | Description |
| :---- | :---- |
| 401 Unauthorized | Bearer Token is missing, invalid, or expired |
| 404 Not Found | No users found for this organization |
| 500 Internal Server Error | Unexpected server error; contact our support team |

# **General Notes**

Please keep the following in mind when integrating with this API:

1. Your Bearer Token is unique to your organization. Do not share it with other organizations or expose it publicly.

2. All API requests and responses use JSON format. Ensure Content-Type: application/json is set on POST requests.

3. The email field is used as a unique identifier per user. Duplicate requests before the user gets onboarded with the same email again will result in a 409 Conflict error.

4. The planHistory array grows over time. Each payment event by the user appends a new entry to this array automatically.

5. All timestamps are returned in ISO 8601 format (UTC timezone).

6. If your token expires or is invalidated, please contact our team to issue a new token.



