# Provider — UI Integration Guide

This document covers the complete provider onboarding flow: registration, login, checking whether the account is a provider, checking verification status, and uploading food-safety evidence (certificates or videos).

---

## Overview: Full UI flow

```
[Register / Link account]
        ↓
   (Kafka async — provider profile created in back-office)
        ↓
      [Login] → get JWT from identity-service
        ↓
  GET /api/provider/me
        ↓
  ┌─────────────────────────────────────────────────────────┐
  │ detail == null (type: SKIP_AS_GOOD)                     │
  │   → "Become a provider" screen                          │
  │     Option A: already have account → provider-link form │
  │     Option B: new account → provider-register form      │
  │                                                         │
  │ detail != null (type: GOOD)                             │
  │   → call GET /api/provider/my-status                    │
  │       ↓                                                 │
  │       verificationStatus:                               │
  │         UNVERIFIED → Upload screen (cert or video)      │
  │         PENDING    → My submissions screen (view/edit)  │
  │         APPROVED   → Provider dashboard                 │
  │         REJECTED   → My submissions + rejection notes   │
  │         SUSPENDED  → Suspended notice screen            │
  └─────────────────────────────────────────────────────────┘
```

---

## Step 1 — Register or link a provider account

> See `provider-register.md` for full details. Summary below.

### Option A — Fresh account (no existing login)

**`POST {identity-service}/api/user/provider-register`** — No auth required.

**Request body:**
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

`gender` values: `MALE` / `FEMALE` / `OTHER` / `UNSPECIFIED`

`bankId` values: `VIETCOMBANK`, `VIETINBANK`, `BIDV`, `AGRIBANK`, `TECHCOMBANK`, `ACB`, `MBBANK`, `SACOMBANK`, `VPBANK`, `TPBANK`, `SHB`, `OCB`, `HDBANK`, `EXIMBANK`

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
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

**UI notes:** On success, redirect to the login page with a "your account is being set up" notice. Do **not** auto-login — the provider profile in back-office is created asynchronously via Kafka.

---

### Option B — Link an existing account

**`POST {identity-service}/api/user/provider-link`** — Requires JWT.

Show a simple form with bank details only; the user's identity is already known from the token.

**Request headers:**
```
Authorization: Bearer <accessToken>
```

**Request body:**
```json
{
  "bankId": "TECHCOMBANK",
  "bankNum": "9876543210"
}
```

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Provider linked successfully",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

**UI notes:** After success, wait briefly (1–2 s) for the Kafka event to be processed, then call `GET /api/provider/me` to confirm the provider profile is ready before routing.

---

## Step 2 — Login

Use the platform's standard login flow (identity-service) to obtain a JWT. All back-office endpoints below require:

```
Authorization: Bearer <accessToken>
```

---

## Step 3 — Check if this account is a provider

Call this immediately after login. This is the single entry-point that determines the entire routing logic.

**`GET {back-office-service}/api/provider/me`** — Requires JWT.

**Request:** No body. Auth header only.

This endpoint also serves as "view my provider information" for providers who are already onboarded.

### Response A — account IS a provider (HTTP 200, `type: GOOD`)

```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Get provider information successfully",
  "detail": {
    "providerId": 3,
    "reputationPoint": 100,
    "verificationStatus": "UNVERIFIED",
    "bankId": "VIETCOMBANK",
    "bankNum": "1234567890",
    "userId": 42
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

**→ Proceed to Step 4 (`GET /api/provider/my-status`) to determine which screen to show.**

### Response B — account is NOT a provider (HTTP 200, `type: SKIP_AS_GOOD`)

```json
{
  "type": "SKIP_AS_GOOD",
  "code": "200 OK",
  "message": "This account is not a provider",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

**→ Show the "Become a provider" screen.** Present two options:
- **I don't have an account yet** → provider-register form (Step 1A, no auth)
- **I already have an account** → provider-link form (Step 1B, uses current JWT)

### Response C — profile not ready yet (Kafka async lag, HTTP 200, `type: SKIP_AS_GOOD`)

Indistinguishable from Response B by `type`. If this happens immediately after registration (within ~3 s), retry up to 3 times with a 1-second delay before concluding the user is not a provider.

---

## Step 4 — Check verification status (routing for confirmed providers)

Only call this after Step 3 confirms `detail != null`.

**`GET {back-office-service}/api/provider/my-status`** — Requires JWT.

**Request:** No body. Auth header only.

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Get verification status successfully",
  "detail": {
    "providerId": 3,
    "verificationStatus": "PENDING",
    "certificates": [
      {
        "certificateId": 1,
        "providerId": 3,
        "certificateType": "VIETGAP",
        "certificateNumber": "VG-2024-001234",
        "issuingAuthority": "Cục Trồng trọt",
        "issuedDate": "2024-01-15",
        "expiryDate": "2026-01-15",
        "documentUrl": "https://pub-b72d8c021b3848f8b4d8805e93e18af6.r2.dev/uuid_cert.jpg",
        "status": "PENDING",
        "reviewedBy": null,
        "reviewNote": null,
        "reviewedAt": null,
        "createdAt": "2026-04-29T10:00:00",
        "updatedAt": "2026-04-29T10:00:00"
      }
    ],
    "videos": []
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

**`verificationStatus` routing:**

| Value        | Route to                                                          |
|--------------|-------------------------------------------------------------------|
| `UNVERIFIED` | Upload screen — no evidence submitted yet                         |
| `PENDING`    | My submissions screen — show uploaded certs/videos, allow editing |
| `APPROVED`   | Provider dashboard with full sidebar                              |
| `REJECTED`   | My submissions screen — show rejection notes, allow re-upload     |
| `SUSPENDED`  | Suspended notice screen                                           |

The `certificates` and `videos` arrays are always included. On the `PENDING` and `REJECTED` screens, render them directly from this response — no second call needed.

---

## Step 5A — Upload a food-safety certificate (UNVERIFIED or REJECTED)

**`POST {back-office-service}/api/provider/certificates`** — Requires JWT. `multipart/form-data`.

**Form fields:**

| Field               | Type              | Required | Description                                            |
|---------------------|-------------------|----------|--------------------------------------------------------|
| `certificateType`   | string (enum)     | Yes      | See values below                                       |
| `certificateNumber` | string            | Yes      | Official certificate number                            |
| `issuingAuthority`  | string            | Yes      | Name of the issuing body                               |
| `issuedDate`        | string (ISO date) | Yes      | Format: `YYYY-MM-DD`                                   |
| `expiryDate`        | string (ISO date) | No       | Format: `YYYY-MM-DD`. Omit if the cert does not expire |
| `file`              | file              | Yes      | Scanned certificate image or PDF                       |

**`certificateType` values:**

| Value               | Description                                                 |
|---------------------|-------------------------------------------------------------|
| `VIETGAP`           | VietGAP (plant/crop)                                        |
| `VIETGAP_LIVESTOCK` | VietGAP (livestock)                                         |
| `GLOBALGAP`         | GlobalGAP                                                   |
| `HACCP`             | HACCP                                                       |
| `ISO_22000`         | ISO 22000                                                   |
| `OCOP`              | OCOP (One Commune One Product)                              |
| `ATTP_MOH`          | Food Safety — Ministry of Health                            |
| `ATTP_MARD`         | Food Safety — Ministry of Agriculture and Rural Development |

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Certificate uploaded successfully",
  "detail": {
    "certificateId": 1,
    "providerId": 3,
    "certificateType": "VIETGAP",
    "certificateNumber": "VG-2024-001234",
    "issuingAuthority": "Cục Trồng trọt",
    "issuedDate": "2024-01-15",
    "expiryDate": "2026-01-15",
    "documentUrl": "https://pub-b72d8c021b3848f8b4d8805e93e18af6.r2.dev/uuid_cert.jpg",
    "status": "PENDING",
    "reviewedBy": null,
    "reviewNote": null,
    "reviewedAt": null,
    "createdAt": "2026-04-29T10:00:00",
    "updatedAt": "2026-04-29T10:00:00"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

**UI note:** After upload, `status` is always `PENDING`. Redirect to the submissions screen (Step 6).

---

## Step 5B — Upload a verification video (UNVERIFIED or REJECTED)

For providers without formal certificates (common in rural areas).

**`POST {back-office-service}/api/provider/videos`** — Requires JWT. `multipart/form-data`.

**Form fields:**

| Field         | Type          | Required | Description                                     |
|---------------|---------------|----------|-------------------------------------------------|
| `videoType`   | string (enum) | Yes      | See values below                                |
| `description` | string        | No       | Provider's own description of the video content |
| `file`        | file          | Yes      | Video file                                      |

**`videoType` values:**

| Value                 | Description                    |
|-----------------------|--------------------------------|
| `WORKING_ENVIRONMENT` | General working environment    |
| `GARDEN_FARM`         | Garden or farm area            |
| `MEAT_PROCESSING`     | Meat slaughter/processing area |
| `VEGETABLE_HARVEST`   | Vegetable harvest process      |
| `STORAGE_FACILITY`    | Storage/refrigeration facility |
| `OTHER`               | Other relevant footage         |

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Video uploaded successfully",
  "detail": {
    "videoId": 1,
    "providerId": 3,
    "videoType": "GARDEN_FARM",
    "videoUrl": "https://pub-1b4c6325308a40f68dc9dca3d1771fbd.r2.dev/uuid_video.mp4",
    "description": "Vườn rau hữu cơ tại Đà Lạt, tưới bằng nước giếng sạch",
    "status": "PENDING",
    "reviewedBy": null,
    "reviewNote": null,
    "reviewedAt": null,
    "createdAt": "2026-04-29T10:00:00",
    "updatedAt": "2026-04-29T10:00:00"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

---

## Step 6 — My submissions screen (PENDING / REJECTED)

All certificate and video data is already available from the Step 4 response — no extra list calls needed to render the screen.

### View a single certificate

**`GET {back-office-service}/api/provider/certificates/{certificateId}`** — Requires JWT.

**Success response — HTTP 200:** Same shape as the upload `detail` above.

### View a single video

**`GET {back-office-service}/api/provider/videos/{videoId}`** — Requires JWT.

**Success response — HTTP 200:** Same shape as the video upload `detail` above.

### Delete a certificate

**`DELETE {back-office-service}/api/provider/certificates/{certificateId}`** — Requires JWT.

Removes the record and deletes the file from storage. Use this when the provider wants to replace a rejected certificate.

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Certificate deleted successfully",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

### Delete a video

**`DELETE {back-office-service}/api/provider/videos/{videoId}`** — Requires JWT.

**Success response — HTTP 200:**
```json
{
  "type": "GOOD",
  "code": "200 OK",
  "message": "Video deleted successfully",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

**UI note for REJECTED state:** When `verificationStatus` is `REJECTED`, display the `reviewNote` field on each item where `status === "REJECTED"` so the provider knows what to fix. Allow delete and re-upload.

---

## Status values reference

### `verificationStatus` on the provider

| Value        | Meaning                                   |
|--------------|-------------------------------------------|
| `UNVERIFIED` | No evidence submitted yet                 |
| `PENDING`    | Evidence submitted, awaiting staff review |
| `APPROVED`   | Staff approved — full dashboard access    |
| `REJECTED`   | Staff rejected — provider must re-submit  |
| `SUSPENDED`  | Account suspended by staff                |

### `status` on individual certificates and videos

| Value      | Meaning                                               |
|------------|-------------------------------------------------------|
| `PENDING`  | Uploaded, not yet reviewed                            |
| `APPROVED` | Reviewed and approved by staff                        |
| `REJECTED` | Reviewed and rejected — check `reviewNote` for reason |

---

## Error response shape (all endpoints)

```json
{
  "type": "ERROR",
  "code": "400 BAD_REQUEST",
  "message": "<reason>",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

Common causes by endpoint:

| Endpoint                                 | Common errors                                                      |
|------------------------------------------|--------------------------------------------------------------------|
| `GET /api/provider/me`                   | Server error (not-a-provider case returns SKIP_AS_GOOD, not ERROR) |
| `GET /api/provider/my-status`            | Server error                                                       |
| `POST /api/provider/certificates`        | Provider account not found, invalid `certificateType` value        |
| `POST /api/provider/videos`              | Provider account not found, invalid `videoType` value              |
| `DELETE /api/provider/certificates/{id}` | Certificate not found                                              |
| `DELETE /api/provider/videos/{id}`       | Video not found                                                    |
