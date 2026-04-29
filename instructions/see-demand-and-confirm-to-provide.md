# Provider UI: View & Confirm Product Demands

## Service Base URLs

| Service | Base URL | Purpose |
|---------|----------|---------|
| **Product Storage Service** | `http://<host>:9200/api` | View demands, confirm to supply |
| **Back-Office Service** | `http://<host>:9100/api` | Provider profile, verification (certificates/videos), categories |

All requests require authentication via JWT. The provider's ID is extracted from the JWT token — you do **not** need to send `providerId` in request bodies.

Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

Every response wraps data in an `ApiResponse<T>` object:

```json
{
  "type": "GOOD" | "ERROR" | "WARN" | "SKIP_AS_GOOD",
  "code": "string",
  "message": "string",
  "detail": <T> | null,
  "timestamp": "2026-04-29T10:00:00"
}
```

- **type**: `GOOD` = success, `ERROR` = failure, `SKIP_AS_GOOD` = empty result (not an error), `WARN` = warning
- **detail**: Contains the actual data object or null
- Always check `type` first to determine success/failure

---

## Flow 2: Provider Views Demands and Confirms Supply

### Step 2.1: View All Available Demands

**GET** `/api/raw-product-demand?pageNum=1&pageSize=20`

Fetch all raw product demands to display in a list/table. Providers can browse and filter by category.

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "OK",
  "message": "Raw product demands retrieved",
  "detail": [
    {
      "demandId": 1,
      "subSubcategoryId": 7,
      "unit": "KILOGRAM",
      "unitQuantity": 500,
      "unitPrice": 85000,
      "currentProgress": 120,
      "dateNeed": "2026-05-05",
      "status": "PARTIALLY_FULFILLED",
      "note": "Cần thịt heo tươi cho tuần sau",
      "createdAt": "2026-04-20T08:00:00",
      "updatedAt": "2026-04-28T14:00:00"
    },
    {
      "demandId": 2,
      "subSubcategoryId": 6,
      "unit": "KILOGRAM",
      "unitQuantity": 300,
      "unitPrice": 220000,
      "currentProgress": 0,
      "dateNeed": "2026-05-10",
      "status": "PENDING",
      "note": "Cần thịt bò Úc loại 1",
      "createdAt": "2026-04-25T08:00:00",
      "updatedAt": "2026-04-25T08:00:00"
    }
  ],
  "timestamp": "2026-04-29T10:00:00"
}
```

**UI Tip**: Show `remainingQuantity = unitQuantity - currentProgress` so providers know how much is still needed. For demand #1 above, remaining = 500 - 120 = 380kg.

---

### Step 2.2: View Demands by Specific Category

**GET** `/api/raw-product-demand/by-category/{subSubcategoryId}`

Use this when the provider wants to filter demands for a specific product type (e.g., only "Thịt Heo" demands).

**Example**: Get all demands for sub-subcategory 7 ("Thịt Heo"):
```
GET /api/raw-product-demand/by-category/7
```

**Success Response**: Same structure as Step 2.1, but filtered to only matching demands.

---

### Step 2.3: Get Demand Details

**GET** `/api/raw-product-demand/{demandId}`

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "OK",
  "message": "Raw product demand retrieved",
  "detail": {
    "demandId": 1,
    "subSubcategoryId": 7,
    "unit": "KILOGRAM",
    "unitQuantity": 500,
    "unitPrice": 85000,
    "currentProgress": 120,
    "dateNeed": "2026-05-05",
    "status": "PARTIALLY_FULFILLED",
    "note": "Cần thịt heo tươi cho tuần sau"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

---

### Step 2.4: Confirm Demand (Commit to Supply)

**POST** `/api/raw-product-demand/{demandId}/confirm`

The provider commits to supplying a portion of the demand. The system automatically determines how to handle this based on the provider's verification method:

- **Certificate-verified provider**: Creates or merges into a dedicated `ProductBatch` (uniquely owned by this provider)
- **Video-verified provider**: Creates a `ProductSubBatch` linked to a shared `ProductBatch` (merged with other video providers for the same demand on the same day)

**Request Body**:
```json
{
  "quantity": 20,
  "note": "Will deliver fresh pork on May 1st morning"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | Long | Yes | Amount the provider can supply (must be ≤ remaining demand) |
| `note` | String | No | Delivery note or commitment details |

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "OK",
  "message": "Demand confirmed by provider",
  "detail": {
    "demandId": 1,
    "subSubcategoryId": 7,
    "unit": "KILOGRAM",
    "unitQuantity": 500,
    "unitPrice": 85000,
    "currentProgress": 140,
    "dateNeed": "2026-05-05",
    "status": "PARTIALLY_FULFILLED",
    "note": "Cần thịt heo tươi cho tuần sau"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

Note how `currentProgress` increased from 120 → 140 (+20kg confirmed).

**Error: Exceeds Remaining Quantity** (HTTP 400):
```json
{
  "type": "ERROR",
  "code": "400",
  "message": "Requested quantity 400 exceeds remaining demand 380",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

**What happens on confirm**:

| Provider Type | What Gets Created |
|---------------|-------------------|
| **Certificate** | A `ProductBatch` with `verificationType: CERTIFICATE`, `providerId: <this-provider>`, `processStatus: WAIT_FOR_DELIVERY`. If this provider already confirmed the same demand, the existing batch's quantity is increased instead of creating a new one. |
| **Video** | A `ProductSubBatch` with `processStatus: WAIT_FOR_DELIVERY` is created and linked to a shared `ProductBatch` (`providerId: null`, `verificationType: VIDEO`). If the shared batch for today doesn't exist, it is created automatically. The shared batch's quantity is increased to reflect the new sub-batch. |

---

## What Happens After Confirmation

After a provider confirms:

1. A `ProductBatch` or `ProductSubBatch` is created with `processStatus: WAIT_FOR_DELIVERY`
2. The demand's `currentProgress` is incremented
3. The demand's `status` auto-updates:
   - If `currentProgress >= unitQuantity` → `FULFILLED`
   - If `currentProgress > 0` but `< unitQuantity` → `PARTIALLY_FULFILLED`

The provider's role ends here. The warehouse admin will later:
- Accept the physical delivery → batch transitions to `PENDING`
- Process the batch → creates sellable product details

---

## Demand Status Values (Read-Only for Provider)

| Status | Meaning for Provider |
|--------|---------------------|
| `PENDING` | No provider has confirmed yet — open for all |
| `PARTIALLY_FULFILLED` | Other providers have confirmed, but there is still remaining quantity available to confirm |
| `FULFILLED` | Demand is fully covered — no more confirmations accepted |
| `CANCELLED` | Demand was cancelled — no longer active |

---

## Error Scenarios

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Quantity exceeds remaining demand | 400 | `Requested quantity X exceeds remaining demand Y` |
| Demand not found | 404 | `Raw product demand not found` |
| Provider not registered in system | 400 | `Provider not found with id: X` |
| Invalid JWT token | 401 | `Unauthorized: token invalid or expired` |
| Server error | 500 | Internal error message |

---

## Complete Confirmation Example

### Scenario: Provider B confirms 20kg Thịt Heo for demand #1

**Step 1**: View demand details
```
GET /api/raw-product-demand/1
```

Response shows:
- `unitQuantity`: 500kg
- `currentProgress`: 120kg
- `status`: PARTIALLY_FULFILLED
- Remaining: 380kg

**Step 2**: Confirm 20kg
```
POST /api/raw-product-demand/1/confirm
```
```json
{
  "quantity": 20,
  "note": "Will deliver on May 1st morning"
}
```

**Step 3**: Verify confirmation
```
GET /api/raw-product-demand/1
```

Response shows updated `currentProgress`: 140kg.

### Behind the Scenes

If Provider B is video-verified:
- System checks if a shared `ProductBatch` already exists for demand #1 today
- If not: creates shared batch with `providerId: null`, `verificationType: VIDEO`
- Creates `ProductSubBatch` (20kg, `providerId: B`, `processStatus: WAIT_FOR_DELIVERY`)
- Shared batch quantity updated

If Provider B is certificate-verified:
- System checks if Provider B already has a batch for demand #1
- If not: creates new `ProductBatch` (`providerId: B`, `verificationType: CERTIFICATE`, `processStatus: WAIT_FOR_DELIVERY`)
- If exists: increases existing batch's quantity by 20kg

---

## Helper APIs from Back-Office Service (`http://<host>:9100/api`)

These APIs are needed for the provider profile page, verification management, and demand filtering.

### A. Provider Profile & Verification Status

#### A.1: Get My Provider Information

**GET** `/api/provider/me`

This is the primary call to load the provider's profile data on login/dashboard. The provider's ID comes from the JWT token — no path parameter needed.

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Get provider information successfully",
  "detail": {
    "providerId": 2,
    "userId": 101,
    "verificationStatus": "APPROVED",
    "verificationMethod": "CERTIFICATE",
    "description": "VietGAP certified pig farm in Đồng Nai",
    "createdAt": "2026-01-15T08:00:00",
    "updatedAt": "2026-02-01T10:00:00"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

**Not a provider account** (HTTP 200 with skip):
```json
{
  "type": "SKIP_AS_GOOD",
  "code": "200",
  "message": "This account is not a provider",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

**Key Fields**:
- `verificationStatus`: `UNVERIFIED`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `verificationMethod`: `CERTIFICATE` or `VIDEO` — this determines how the provider's products are handled when confirming demands

#### A.2: Get My Verification Status (with Certificates & Videos)

**GET** `/api/provider/my-status`

Returns full verification details including all uploaded certificates and videos with their review statuses.

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Get verification status successfully",
  "detail": {
    "providerId": 2,
    "verificationStatus": "APPROVED",
    "verificationMethod": "CERTIFICATE",
    "certificates": [
      {
        "certificateId": 10,
        "providerId": 2,
        "certificateType": "VIETGAP",
        "certificateNumber": "VG-2025-12345",
        "issuingAuthority": "Bộ Nông nghiệp và PTNT",
        "issuedDate": "2025-06-15",
        "expiryDate": "2027-06-15",
        "documentUrl": "https://pub-b72d8c021b3848f8b4d8805e93e18af6.r2.dev/cert-vietgap-abc.pdf",
        "status": "APPROVED",
        "reviewNote": null
      }
    ],
    "videos": []
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

**UI Tip**: Use this response to show the verification badge on the dashboard. If `verificationStatus` is `APPROVED`, show a green checkmark. If `PENDING`, show "Under Review". If `REJECTED`, show the `reviewNote`.

---

### B. Certificate Management (for Certificate-Verified Providers)

#### B.1: Upload a New Certificate

**POST** `/api/provider/certificates`

This is a multipart form request (not JSON body).

**Request** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `certificateType` | String | Yes | One of: `VIETGAP`, `VIETGAP_LIVESTOCK`, `GLOBALGAP`, `HACCP`, `ISO_22000`, `OCOP`, `ATTP_MOH`, `ATTP_MARD` |
| `certificateNumber` | String | Yes | Certificate serial/registration number |
| `issuingAuthority` | String | Yes | Government body that issued the certificate |
| `issuedDate` | String | Yes | ISO date format: `YYYY-MM-DD` |
| `expiryDate` | String | No | ISO date format: `YYYY-MM-DD` |
| `file` | File | Yes | PDF or image file of the certificate document |

**Example** (using FormData):
```javascript
const formData = new FormData();
formData.append('certificateType', 'VIETGAP');
formData.append('certificateNumber', 'VG-2025-12345');
formData.append('issuingAuthority', 'Bộ Nông nghiệp và PTNT');
formData.append('issuedDate', '2025-06-15');
formData.append('expiryDate', '2027-06-15');
formData.append('file', pdfFile);

fetch('/api/provider/certificates', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Certificate uploaded successfully",
  "detail": {
    "certificateId": 10,
    "certificateType": "VIETGAP",
    "certificateNumber": "VG-2025-12345",
    "issuingAuthority": "Bộ Nông nghiệp và PTNT",
    "issuedDate": "2025-06-15",
    "expiryDate": "2027-06-15",
    "documentUrl": "https://pub-b72d8c021b3848f8b4d8805e93e18af6.r2.dev/cert-vietgap-abc.pdf",
    "status": "PENDING",
    "reviewNote": null
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

#### B.2: List My Certificates

**GET** `/api/provider/certificates`

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Get certificates successfully",
  "detail": [
    {
      "certificateId": 10,
      "certificateType": "VIETGAP",
      "certificateNumber": "VG-2025-12345",
      "issuingAuthority": "Bộ Nông nghiệp và PTNT",
      "documentUrl": "https://pub-b72d8c021b3848f8b4d8805e93e18af6.r2.dev/cert-vietgap-abc.pdf",
      "status": "APPROVED",
      "reviewNote": null
    },
    {
      "certificateId": 11,
      "certificateType": "HACCP",
      "certificateNumber": "HACCP-2025-67890",
      "issuingAuthority": "Cục An toàn Thực phẩm",
      "documentUrl": "...",
      "status": "PENDING",
      "reviewNote": null
    }
  ],
  "timestamp": "2026-04-29T10:00:00"
}
```

**Empty Response**:
```json
{
  "type": "SKIP_AS_GOOD",
  "code": "200",
  "message": "No certificates found",
  "detail": null,
  "timestamp": "2026-04-29T10:00:00"
}
```

#### B.3: Get Single Certificate

**GET** `/api/provider/certificates/{certificateId}`

**Example**: `GET /api/provider/certificates/10`

#### B.4: Delete a Certificate

**DELETE** `/api/provider/certificates/{certificateId}`

---

### C. Video Verification Management (for Video-Verified Providers)

#### C.1: Create a Video Record

**POST** `/api/provider/videos`

Creates a video record first (returns a videoId), then you upload the actual video file.

**Request Body** (JSON):
```json
{
  "videoType": "GARDEN_FARM",
  "description": "Video showing our organic vegetable farm and harvesting process"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videoType` | String | Yes | One of: `WORKING_ENVIRONMENT`, `GARDEN_FARM`, `MEAT_PROCESSING`, `VEGETABLE_HARVEST`, `STORAGE_FACILITY`, `OTHER` |
| `description` | String | Yes | Description of what the video shows |

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Video record created successfully",
  "detail": {
    "videoId": 20,
    "videoType": "GARDEN_FARM",
    "description": "Video showing our organic vegetable farm and harvesting process",
    "videoUrl": null,
    "status": "PENDING",
    "uploadedAt": null
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

#### C.2: Upload Video File

**POST** `/api/provider/videos/{videoId}/upload`

After creating the video record, upload the actual video file.

**Request** (multipart/form-data):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Video file (MP4, MOV, etc.) |

**Example**:
```javascript
const formData = new FormData();
formData.append('file', videoFile);

fetch('/api/provider/videos/20/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Video uploaded successfully",
  "detail": {
    "videoId": 20,
    "videoType": "GARDEN_FARM",
    "description": "Video showing our organic vegetable farm",
    "videoUrl": "https://pub-1b4c6325308a40f68dc9dca3d1771fbd.r2.dev/farm-tour-video.mp4",
    "status": "PENDING",
    "uploadedAt": "2026-04-29T10:00:00"
  },
  "timestamp": "2026-04-29T10:00:00"
}
```

#### C.3: List My Videos

**GET** `/api/provider/videos`

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Get videos successfully",
  "detail": [
    {
      "videoId": 20,
      "videoType": "GARDEN_FARM",
      "description": "Video showing our organic vegetable farm",
      "videoUrl": "https://pub-1b4c6325308a40f68dc9dca3d1771fbd.r2.dev/farm-tour-video.mp4",
      "status": "APPROVED",
      "reviewNote": "Good quality footage, clearly shows farming practices",
      "uploadedAt": "2026-04-29T10:00:00"
    }
  ],
  "timestamp": "2026-04-29T10:00:00"
}
```

#### C.4: Get Single Video

**GET** `/api/provider/videos/{videoId}`

#### C.5: Delete a Video

**DELETE** `/api/provider/videos/{videoId}`

---

### D. Categories (for demand filtering)

#### D.1: Get All Sub-Subcategories (for demand category filter dropdown)

**GET** `/api/categories/sub-subcategories`

Returns all product sub-subcategories. Use this to build a category filter on the demand listing page.

**Success Response**:
```json
{
  "type": "GOOD",
  "code": "200",
  "message": "Sub-subcategory retrieved successfully",
  "detail": [
    {
      "subSubcategoryId": 1,
      "name": "Thịt Gà",
      "description": "Thịt gà tươi nguyên con và các phần",
      "subcategoryId": 2,
      "avgShelfDays": 3
    },
    {
      "subSubcategoryId": 7,
      "name": "Thịt Heo",
      "description": "Thịt heo tươi các loại",
      "subcategoryId": 3,
      "avgShelfDays": 3
    },
    {
      "subSubcategoryId": 11,
      "name": "Tôm Tươi",
      "description": "Tôm sú, tôm thẻ tươi sống",
      "subcategoryId": 4,
      "avgShelfDays": 2
    }
  ],
  "timestamp": "2026-04-29T10:00:00"
}
```

#### D.2: Get Sub-Subcategories Under a Subcategory

**GET** `/api/categories/{subcategoryId}/sub-subcategories`

**Example**: Get all meat types under subcategory 3 ("Thịt"):
```
GET /api/categories/3/sub-subcategories
```

**Example**: Get all seafood types under subcategory 4 ("Hải Sản"):
```
GET /api/categories/4/sub-subcategories
```

---

### E. Product Generals (for product reference)

#### E.1: List All Product Generals

**GET** `/api/product-general?pageNum=1&pageSize=20`

Useful if the provider wants to see what product types exist under their product category.

---

## Suggested UI Page Structure

### Page 1: Provider Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome, Nguyễn Văn B!                           [Profile] [⚙️] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │  Verification Status     │  │  Available Demands           │ │
│  │                          │  │                              │ │
│  │  ✅ APPROVED             │  │  3 open demands              │ │
│  │  📜 VIETGAP Certified    │  │  for your products           │ │
│  │                          │  │         [View Demands →]     │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                 │
│  Recent Activity                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Confirmed 20kg Thịt Heo for Demand #1     2 hours ago  │  │
│  │ • Certificate HACCP uploaded, under review  1 day ago    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- Profile info + verification status: `GET /api/provider/me` (product-storage or back-office)
- Full verification details: `GET /api/provider/my-status` (back-office)
- Available demands count: `GET /api/raw-product-demand?pageNum=1&pageSize=1` (product-storage)

### Page 2: Browse & Confirm Demands

```
┌─────────────────────────────────────────────────────────────────┐
│ Available Demands                                               │
├─────────────────────────────────────────────────────────────────┤
│ Filter by category: [All Categories ▼]                          │
│                                                                 │
│ ┌───┬─────────────┬──────────┬─────────┬──────────┬──────────┐  │
│ │ # │ Product     │ Total    │ Need By │ Remaining│ Confirm  │  │
│ ├───┼─────────────┼──────────┼─────────┼──────────┼──────────┤  │
│ │ 1 │ Thịt Heo    │ 500 kg   │ May 05  │ 380 kg   │ [Confirm]│  │
│ │   │ 85,000/kg   │          │         │          │          │  │
│ │   │ 📝 Cần thịt │          │         │          │          │  │
│ │   │    heo tươi │          │         │          │          │  │
│ ├───┼─────────────┼──────────┼─────────┼──────────┼──────────┤  │
│ │ 2 │ Thịt Bò     │ 300 kg   │ May 10  │ 300 kg   │ [Confirm]│  │
│ │   │ 220,000/kg  │          │         │          │          │  │
│ │   │ 📝 Cần thịt │          │         │          │          │  │
│ │   │    bò Úc    │          │         │          │          │  │
│ └───┴─────────────┴──────────┴─────────┴──────────┴──────────┘  │
│ Page: 1 2 3 ...                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- Demands list: `GET /api/raw-product-demand?pageNum=X&pageSize=20` (product-storage)
- Category filter options: `GET /api/categories/sub-subcategories` (back-office)
- Category names for display: map `subSubcategoryId` from demand to category name
- Remaining quantity: `unitQuantity - currentProgress` (calculated client-side)

### Page 3: Confirm Demand Dialog

```
┌─────────────────────────────────────────────────┐
│ Confirm Supply: Thịt Heo                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Demand: #1 - Thịt Heo                           │
│ Required: 500 kg                                │
│ Already covered: 120 kg                         │
│ Remaining: 380 kg                               │
│ Unit Price: 85,000 VND/kg                       │
│ Need by: May 05, 2026                           │
│ Note from buyer: Cần thịt heo tươi cho tuần sau  │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Quantity you can supply:                        │
│ [20     ] kg                                    │
│            (max 380 kg remaining)               │
│                                                 │
│ Delivery note (optional):                       │
│ [Will deliver fresh on May 1st morning...]      │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ ℹ️ Your products will be tracked individually   │
│    (Certificate-verified provider)              │
│                                                 │
│              [Cancel]  [Confirm Supply]          │
└─────────────────────────────────────────────────┘
```

**Data Sources**:
- Demand details: `GET /api/raw-product-demand/{demandId}` (product-storage)
- Your verification type: `GET /api/provider/me` → `verificationMethod` (back-office)

### Page 4: Provider Profile & Verification

```
┌─────────────────────────────────────────────────────────────────┐
│ My Profile                                     [Edit Profile]    │
├─────────────────────────────────────────────────────────────────┤
│ Name: Nguyễn Văn B                                              │
│ Email: providerB@example.com                                    │
│ Phone: 0901234567                                               │
│ Address: 456 Đường XYZ, Huyện Trảng Bom, Đồng Nai               │
│                                                                 │
│ ── Verification Status ───────────────────────────────────────  │
│                                                                 │
│ Status: ✅ APPROVED                                             │
│ Method: Certificate                                             │
│                                                                 │
│ ── Certificates ──────────────────────────────────────────────  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 📜 VIETGAP  |  VG-2025-12345  |  ✅ Approved              │   │
│ │    Bộ Nông nghiệp và PTNT  |  Expires: Jun 15, 2027       │   │
│ │    [View PDF]  [Delete]                                   │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ 📜 HACCP    |  HACCP-2025-67  |  ⏳ Under Review           │   │
│ │    Cục An toàn Thực phẩm  |  Expires: Dec 31, 2026        │   │
│ │    [View PDF]  [Delete]                                   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│                          [+ Add Certificate]                     │
│                                                                 │
│ ── Verification Videos ──────────────────────────────────────  │
│                                                                 │
│  No videos uploaded yet.                                        │
│                          [+ Add Video]                           │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- Profile info: `GET /api/provider/me` (back-office)
- Certificates: `GET /api/provider/certificates` (back-office)
- Videos: `GET /api/provider/videos` (back-office)
- Full verification details: `GET /api/provider/my-status` (back-office)

**Add Certificate Dialog**:
```
┌─────────────────────────────────────────────────┐
│ Upload New Certificate                          │
├─────────────────────────────────────────────────┤
│ Certificate Type:  [VIETGAP ▼]                  │
│ Certificate No.:   [________________]           │
│ Issuing Authority: [________________]           │
│ Issue Date:        [YYYY-MM-DD]                 │
│ Expiry Date:       [YYYY-MM-DD] (optional)      │
│ Document File:     [Choose File] cert.pdf        │
│                                                 │
│              [Cancel]  [Upload]                  │
└─────────────────────────────────────────────────┘
```

**Data Sources for Dropdown**:
- Certificate types: `VIETGAP`, `VIETGAP_LIVESTOCK`, `GLOBALGAP`, `HACCP`, `ISO_22000`, `OCOP`, `ATTP_MOH`, `ATTP_MARD`

**Add Video Dialog** (two-step process):
```
Step 1: Create Video Record                    Step 2: Upload Video File
┌──────────────────────────────────┐           ┌──────────────────────────────────┐
│ Video Type:      [GARDEN_FARM ▼] │           │ Selected: GARDEN_FARM            │
│ Description:                      │           │                                  │
│ [Farm tour showing our organic...]│           │ [Choose Video File] farm.mp4     │
│                                   │           │ File size: 45 MB                 │
│              [Next →]             │           │                                  │
└──────────────────────────────────┘           │            [Upload →]              │
                                               └──────────────────────────────────┘
```

**Data Sources for Dropdown**:
- Video types: `WORKING_ENVIRONMENT`, `GARDEN_FARM`, `MEAT_PROCESSING`, `VEGETABLE_HARVEST`, `STORAGE_FACILITY`, `OTHER`
