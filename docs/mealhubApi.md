# MealHub API 使用文件（前端串接版）

本文件依目前後端程式碼整理（`routes/api.php` + Controllers + FormRequests）。

## 1) 基本資訊

- Base URL: `{{API_HOST}}/api`
- Content-Type: `application/json`
- 驗證方式（需登入 API）:
  - Header: `Authorization: Bearer <accessToken>`

## 2) 統一回應格式

所有 API 都回傳同一層結構：

```json
{
  "status": "0000",
  "message": "success",
  "data": {},
  "errors": {},
  "meta": {}
}
```

- `status`:
  - `"0000"`: 成功
  - `"9999"`: 失敗
- `message`: 錯誤或成功 key（例如 `validationError`, `unauthorized`, `notFound`）
- `data`: 實際資料（可為 `null`）
- `errors`: 只在驗證失敗時出現
- `meta`: 分頁資訊等

## 3) 常見 HTTP 狀態碼（依 message key）

- `200`: `success`
- `401`: `unauthorized`, `invalidCredentials`, `invalidRefreshToken`, `refreshTokenReplayed`, `missingBearerToken`, `invalidToken`, `tokenRevoked`, `tokenExpired`
- `403`: `forbidden`
- `404`: `notFound`
- `409`: `cannotModifyTimeslotActive`, `cannotModifyTimeslotsActive`
- `422`: `validationError`
- `500`: `failure`（以及未映射的錯誤 key）

注意：部分業務錯誤 key（例如 `sold_out`, `no_capacity_for_party_size`, `already_reserved_this_restaurant`）目前未映射，HTTP 會是 `500`，但 `message` 會帶具體 key。

## 4) 資料模型（前端常用）

- User
  - `id`, `firstName`, `lastName`, `email`, `phone`, `status`
  - `status`: `ACTIVE | SUSPENDED | DELETED`
- Restaurant
  - `id`, `name`, `description`, `address`, `note`, `timeslots`, `tableBuckets`, `status`
  - `status`: `ACTIVE | INACTIVE | CLOSED`
  - `timeslots` 範例: `[{"start":"18:00","end":"19:30"}]`
  - `tableBuckets` 範例: `{"2":10,"4":5}`
- Reservation
  - `id`, `restaurantId`, `date`, `timeslot`, `partySize`, `status`
  - `status`: `CONFIRMED | CANCELLED`

## 5) Auth APIs

### POST `/auth/register`
- Auth: 否
- Body:
```json
{
  "firstName": "Akira",
  "lastName": "Lin",
  "email": "akira@example.com",
  "phone": "0912345678",
  "password": "password123"
}
```
- 成功 `data`: User

### POST `/auth/login`
- Auth: 否
- Body（`email` 與 `phone` 擇一，`password` 必填）:
```json
{
  "email": "akira@example.com",
  "password": "password123",
  "deviceType": "WEB"
}
```
- `deviceType`: `WEB | ANDROID | IOS`
- 成功 `data`:
```json
{
  "accessToken": "jwt...",
  "refreshToken": "token...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### POST `/auth/refresh`
- Auth: 否
- Body:
```json
{
  "refreshToken": "..."
}
```
- 成功 `data`: 同 login token 結構

### POST `/auth/logout`
- Auth: 是（Bearer）
- Body:
```json
{
  "refreshToken": "..."
}
```
- 成功 `data`: `null`

### POST `/auth/logout-all`
- Auth: 是（Bearer）
- Body: 無
- 成功 `data`: `null`

## 6) User APIs

### GET `/me`
- Auth: 是
- Query/Body: 無
- 成功 `data`: User

### PATCH `/me`
- Auth: 是
- Body（皆選填）:
```json
{
  "firstName": "Akira",
  "lastName": "Lin",
  "phone": "0987654321",
  "password": "newpassword123"
}
```
- 成功 `data`: 更新後 User

## 7) Restaurant APIs

### GET `/restaurants`
- Auth: 是
- Query:
  - `name` (optional)
  - `status` (optional)
  - `page` (default `1`)
  - `perPage` (default `10`, max `100`)
- 成功 `data`: `Restaurant[]`
- 成功 `meta`:
```json
{
  "page": 1,
  "perPage": 10,
  "total": 100,
  "lastPage": 10
}
```

### GET `/restaurants/{restaurantId}`
- Auth: 是
- 成功 `data`: Restaurant

### POST `/restaurants`
- Auth: 是
- Body:
```json
{
  "name": "MealHub Bistro",
  "description": "desc",
  "address": "Taipei",
  "note": "note",
  "tableBuckets": {"2": 10, "4": 5},
  "timeslots": [
    {"start": "18:00", "end": "19:30"},
    {"start": "19:30", "end": "21:00"}
  ]
}
```
- 成功 `data`: Restaurant

### PATCH `/restaurants/{restaurantId}`
- Auth: 是（餐廳管理員）
- Body（全部選填）:
```json
{
  "name": "New Name",
  "description": null,
  "address": "New Address",
  "note": "New Note",
  "tableBuckets": {"2": 8, "4": 6},
  "timeslots": [
    {"start": "18:00", "end": "19:30"}
  ]
}
```
- 成功 `data`: Restaurant

### PATCH `/restaurants/{restaurantId}/timeslots`
- Auth: 是（餐廳管理員）
- Body:
```json
{
  "timeslots": [
    {"start": "18:00", "end": "19:30"},
    {"start": "19:30", "end": "21:00"}
  ]
}
```
- 可能錯誤:
  - `cannotModifyTimeslotsActive`（409）

### GET `/restaurants/{restaurantId}/admins`
- Auth: 是（餐廳管理員）
- 成功 `data`:
```json
[
  {
    "id": 1,
    "firstName": "Akira",
    "lastName": "Lin",
    "email": "akira@example.com"
  }
]
```

### POST `/restaurants/{restaurantId}/admins`
- Auth: 是（餐廳管理員）
- Body:
```json
{
  "userId": 2
}
```
- 成功 `data`: `null`

### DELETE `/restaurants/{restaurantId}/admins`
- Auth: 是（餐廳管理員）
- Body:
```json
{
  "userId": 2
}
```
- 成功 `data`: `null`

### GET `/restaurants/{restaurantId}/availability`
- Auth: 是
- Query:
  - `date` (`Y-m-d`, required)
  - `partySize` (required)
- 成功 `data`:
```json
[
  {
    "start": "18:00",
    "end": "19:30",
    "capacity": 10,
    "reserved": 3,
    "available": 7
  }
]
```

### GET `/restaurants/{restaurantId}/availability/detail`
- Auth: 是
- Query:
  - `date` (`Y-m-d`, required)
- 成功 `data`:
```json
[
  {
    "start": "18:00",
    "end": "19:30",
    "byPartySize": [
      {"size": 2, "capacity": 10, "reserved": 3, "available": 7},
      {"size": 4, "capacity": 5, "reserved": 1, "available": 4}
    ],
    "totals": {"capacity": 15, "reserved": 4, "available": 11}
  }
]
```

### GET `/restaurants/{restaurantId}/reservations`
- Auth: 是（餐廳管理員）
- Query:
  - `date` (`Y-m-d`, required)
  - `timeslot` (optional, 例如 `18:00-19:30`)
- 成功 `data`:
```json
{
  "summary": [
    {"timeslot": "18:00-19:30", "party_size": 2, "count": 3}
  ],
  "items": [
    {"id": 10, "user_id": 1, "reserve_date": "2026-03-01", "timeslot": "18:00-19:30", "party_size": 2, "status": "CONFIRMED"}
  ]
}
```

## 8) Reservation APIs

### POST `/reservations`
- Auth: 是
- Body:
```json
{
  "restaurantId": 1,
  "date": "2026-03-01",
  "start": "18:00",
  "end": "19:30",
  "partySize": 2,
  "guestEmails": ["guest@example.com"]
}
```
- 成功 `data`:
```json
{
  "code": "uuid-or-code",
  "shortToken": "shorttoken"
}
```
- 可能業務錯誤 `message`:
  - `sold_out`
  - `no_capacity_for_party_size`
  - `already_reserved_this_restaurant`

### POST `/reservations/cancel`
- Auth: 是
- Body:
```json
{
  "reservationId": 123
}
```
- 成功 `data`:
```json
{
  "cancelled": 1
}
```

### GET `/reservations/my`
- Auth: 是
- 成功 `data`:
```json
[
  {
    "id": 123,
    "restaurantId": 1,
    "date": "2026-03-01",
    "timeslot": "18:00-19:30",
    "partySize": 2,
    "status": "CONFIRMED"
  }
]
```

### PATCH `/reservations`
- Auth: 是
- Body:
```json
{
  "reservationId": 123,
  "start": "20:00",
  "end": "21:30"
}
```
- 成功 `data`: Reservation（單筆）
- 可能錯誤:
  - `notFound`（404）
  - `cannotModifyTimeslotActive`（409）

### GET `/reservations/code/{code}`
- Auth: 否
- 成功 `data`: Reservation（單筆）

### GET `/reservations/short/{token}`
- Auth: 否
- 成功 `data`: Reservation（單筆）

## 9) 前端串接建議

- 建立 API client middleware：
  - 自動帶 `Authorization` header
  - 401 時嘗試 `/auth/refresh`，成功後重送原請求
  - refresh 失敗則導回登入
- 判斷錯誤時優先看：
  - `HTTP status`
  - `message`（業務判斷建議用這個 key）
- 分頁資料記得讀 `meta`

