# Provider Registration — UI Integration Guide

Two separate endpoints handle provider onboarding depending on whether the user already has an account.

---

## 1. Create a fresh provider account

**`POST {identity-service}/api/user/provider-register`** — No authentication required.

Use this when someone wants to register as a provider for the first time and does not yet have any account on the platform.

### Suggested UI flow

Show a multi-step form (or a single scrollable form) with two logical sections:

**Account information**
- Email (text input)
- Password (password input)
- Confirm password (password input, client-side match validation only)
- First name
- Last name
- Date of birth (date picker)
- Phone number
- Gender (dropdown: `MALE` / `FEMALE` / `OTHER` / `UNSPECIFIED`)

**Bank information**
- Bank (dropdown, select one of the values below)
- Bank account number (text input)

Available `bankId` values:
`VIETCOMBANK`, `VIETINBANK`, `BIDV`, `AGRIBANK`, `TECHCOMBANK`, `ACB`, `MBBANK`, `SACOMBANK`, `VPBANK`, `TPBANK`, `SHB`, `OCB`, `HDBANK`, `EXIMBANK`

### Request body

```json
{
  "email": "provider@example.com",
  "password": "secretpassword",
  "fName": "Nguyen",
  "lName": "Van A",
  "dob": "1990-05-15",
  "pNum": "0901234567",
  "gender": "MALE",
  "bankId": "VIETCOMBANK",
  "bankNum": "1234567890"
}
```

`dob` format: `YYYY-MM-DD`.

### Success response — HTTP 200

```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Create provider account successfully",
  "detail": {
    "userId": 42,
    "userEmail": "provider@example.com",
    "hashedPwd": "",
    "createdAt": "2026-04-29T10:00:00",
    "updatedAt": "2026-04-29T10:00:00"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

`hashedPwd` is always returned as an empty string. The `detail` object is the identity-service `User` record (not the provider profile — that is created asynchronously by back-office-service via Kafka).

### Error response — HTTP 400

```json
{
  "type": "ERROR",
  "code": "400",
  "message": "Create provider account failed",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

Common causes: duplicate email.

### UI notes

- On success, redirect the user to the login page with a notice that their provider profile is being set up. Do **not** auto-login; the account is created but the provider record in back-office is processed asynchronously.
- The `userId` from the response can be stored if the UI needs to display a "pending verification" state.

---

## 2. Link an existing account to a provider

**`POST {identity-service}/api/user/provider-link`** — Requires a valid JWT Bearer token.

Use this when a logged-in buyer or employee wants to become a provider. No new identity account is created; only a provider profile is registered in back-office-service.

### Request headers

```
Authorization: Bearer <accessToken>
```

### Suggested UI flow

Show a simple form with only bank details. The user's identity is already known from the token.

- Bank (dropdown, same values as above)
- Bank account number (text input)

### Request body

```json
{
  "bankId": "TECHCOMBANK",
  "bankNum": "9876543210"
}
```

### Success response — HTTP 200

```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Provider linked successfully",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

### Error response — HTTP 400

```json
{
  "type": "ERROR",
  "code": "400",
  "message": "User not found",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

### UI notes

- Show a success banner and optionally redirect to a "provider dashboard pending" page.
- If the request returns 401, the token has expired — redirect to the login page.

---

## Asynchronous processing note

Both endpoints publish a `ProviderCreatedEvent` to the `provider-create-events` Kafka topic. The actual provider profile (bank details, verification status, reputation score) is created by **back-office-service** asynchronously after the event is consumed. The identity-service response only confirms that the identity account was handled — it does not mean the provider profile is ready yet.
